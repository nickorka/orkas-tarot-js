-- Translates the English UI texts and cards into one target language with
-- AI_TRANSLATE. Only rows missing for that language are added, so
-- hand-corrected translations are kept; delete a row to re-translate it.
--
-- Run after seed_en.sql. For a new language, set LANG and LANG_NAME
-- below and run the whole script.

USE WAREHOUSE TAROT_WH;
USE SCHEMA TAROT.APP;

SET LANG        = 'zh';
SET LANG_NAME   = 'Chinese';
-- Language name in the language itself, first letter capitalized for the picker.
SET LANG_NATIVE = (
    SELECT UPPER(LEFT(t, 1)) || SUBSTR(t, 2)
    FROM (SELECT AI_TRANSLATE($LANG_NAME, 'en', $LANG) AS t)
);

MERGE INTO TAROT.APP.LANGUAGES t
USING (SELECT $LANG AS LANGUAGE_CODE, $LANG_NAME AS NAME, $LANG_NATIVE AS NATIVE_NAME) s
ON t.LANGUAGE_CODE = s.LANGUAGE_CODE
WHEN NOT MATCHED THEN INSERT (LANGUAGE_CODE, NAME, NATIVE_NAME, ENABLED)
    VALUES (s.LANGUAGE_CODE, s.NAME, s.NATIVE_NAME, TRUE);

-- AI_TRANSLATE sometimes returns short labels unchanged ("One Card",
-- "Deck Browser"). Whenever its result equals the English text, the text
-- is translated again with AI_COMPLETE and this instruction as context.
SET FALLBACK_PROMPT = 'You translate user-interface labels and texts of a tarot reading app '
    || 'from English into the language with code ' || $LANG || '. Reply with the translation only, '
    || 'no quotes, no explanation. Keep {placeholders} and markdown unchanged.\n\nText: ';
SET FALLBACK_MODEL = 'llama3.3-70b';

-- ------------------------------------------------------------- UI texts
-- The app name is never translated (other texts use the {app} placeholder);
-- keep this list in sync with UNTRANSLATED_IDS in src/lib/i18n/en.ts.
SET UNTRANSLATED_IDS = '["app.name"]';

DELETE FROM TAROT.APP.UI_TEXT
WHERE LANGUAGE_CODE = $LANG AND ARRAY_CONTAINS(UI_ID::VARIANT, PARSE_JSON($UNTRANSLATED_IDS));

INSERT INTO TAROT.APP.UI_TEXT (UI_ID, LANGUAGE_CODE, CONTENT)
SELECT UI_ID, $LANG, IFF(T = CONTENT, TRIM(AI_COMPLETE($FALLBACK_MODEL, $FALLBACK_PROMPT || CONTENT)), T)
FROM (
    SELECT e.UI_ID, e.CONTENT, AI_TRANSLATE(e.CONTENT, 'en', $LANG) AS T
    FROM TAROT.APP.UI_TEXT e
    WHERE e.LANGUAGE_CODE = 'en'
      AND NOT ARRAY_CONTAINS(e.UI_ID::VARIANT, PARSE_JSON($UNTRANSLATED_IDS))
      AND NOT EXISTS (
          SELECT 1 FROM TAROT.APP.UI_TEXT x WHERE x.UI_ID = e.UI_ID AND x.LANGUAGE_CODE = $LANG
      )
);

-- Repair rows stored untranslated by earlier runs (identical to English).
UPDATE TAROT.APP.UI_TEXT r
SET CONTENT = TRIM(AI_COMPLETE($FALLBACK_MODEL, $FALLBACK_PROMPT || e.CONTENT))
FROM TAROT.APP.UI_TEXT e
WHERE r.LANGUAGE_CODE = $LANG
  AND e.LANGUAGE_CODE = 'en' AND e.UI_ID = r.UI_ID
  AND r.CONTENT = e.CONTENT;

-- ---------------------------------------------------------------- cards
-- Arcana and rank are translated once per distinct value so every card
-- uses the same term; roman numerals / digits are kept as they are.
-- Short fields (name, arcana, rank) get the same AI_COMPLETE fallback.
INSERT INTO TAROT.APP.CARDS
    (CARD_ID, LANGUAGE_CODE, NAME, ARCANA, RANK, KEYWORDS, MEANING, UPRIGHT, REVERSED)
WITH
arcana AS (
    SELECT ARCANA, IFF(T = ARCANA, TRIM(AI_COMPLETE($FALLBACK_MODEL, $FALLBACK_PROMPT || ARCANA)), T) AS T
    FROM (
        SELECT ARCANA, AI_TRANSLATE(ARCANA, 'en', $LANG) AS T
        FROM (SELECT DISTINCT ARCANA FROM TAROT.APP.CARDS WHERE LANGUAGE_CODE = 'en')
    )
),
ranks AS (
    SELECT RANK, IFF(REGEXP_LIKE(RANK, '^[0-9IVXLC]+$'), RANK,
                     IFF(T = RANK, TRIM(AI_COMPLETE($FALLBACK_MODEL, $FALLBACK_PROMPT || RANK)), T)) AS T
    FROM (
        SELECT RANK, AI_TRANSLATE(RANK, 'en', $LANG) AS T
        FROM (SELECT DISTINCT RANK FROM TAROT.APP.CARDS WHERE LANGUAGE_CODE = 'en')
    )
),
names AS (
    SELECT CARD_ID, IFF(T = NAME, TRIM(AI_COMPLETE($FALLBACK_MODEL, $FALLBACK_PROMPT || NAME)), T) AS T
    FROM (
        SELECT CARD_ID, NAME, AI_TRANSLATE(NAME, 'en', $LANG) AS T
        FROM TAROT.APP.CARDS WHERE LANGUAGE_CODE = 'en'
    )
)
SELECT
    e.CARD_ID, $LANG,
    n.T,
    a.T,
    r.T,
    AI_TRANSLATE(e.KEYWORDS, 'en', $LANG),
    AI_TRANSLATE(e.MEANING, 'en', $LANG),
    AI_TRANSLATE(e.UPRIGHT, 'en', $LANG),
    AI_TRANSLATE(e.REVERSED, 'en', $LANG)
FROM TAROT.APP.CARDS e
JOIN names n ON n.CARD_ID = e.CARD_ID
JOIN arcana a ON a.ARCANA = e.ARCANA
JOIN ranks r ON r.RANK = e.RANK
WHERE e.LANGUAGE_CODE = 'en'
  AND NOT EXISTS (
      SELECT 1 FROM TAROT.APP.CARDS x WHERE x.CARD_ID = e.CARD_ID AND x.LANGUAGE_CODE = $LANG
  );

-- Repair card names / arcana / ranks stored untranslated by earlier runs.
UPDATE TAROT.APP.CARDS r
SET NAME   = IFF(r.NAME = e.NAME, TRIM(AI_COMPLETE($FALLBACK_MODEL, $FALLBACK_PROMPT || e.NAME)), r.NAME),
    ARCANA = IFF(r.ARCANA = e.ARCANA, TRIM(AI_COMPLETE($FALLBACK_MODEL, $FALLBACK_PROMPT || e.ARCANA)), r.ARCANA),
    RANK   = IFF(r.RANK = e.RANK AND NOT REGEXP_LIKE(e.RANK, '^[0-9IVXLC]+$'),
                 TRIM(AI_COMPLETE($FALLBACK_MODEL, $FALLBACK_PROMPT || e.RANK)), r.RANK)
FROM TAROT.APP.CARDS e
WHERE r.LANGUAGE_CODE = $LANG
  AND e.LANGUAGE_CODE = 'en' AND e.CARD_ID = r.CARD_ID
  AND (r.NAME = e.NAME OR r.ARCANA = e.ARCANA
       OR (r.RANK = e.RANK AND NOT REGEXP_LIKE(e.RANK, '^[0-9IVXLC]+$')));

-- ---------------------------------------------------------------- checks
-- UI texts whose {placeholders} did not survive translation (fix by hand).
SELECT e.UI_ID, e.CONTENT AS EN, t.CONTENT AS TRANSLATED
FROM TAROT.APP.UI_TEXT e
JOIN TAROT.APP.UI_TEXT t ON t.UI_ID = e.UI_ID AND t.LANGUAGE_CODE = $LANG
WHERE e.LANGUAGE_CODE = 'en'
  AND ARRAY_TO_STRING(ARRAY_SORT(REGEXP_SUBSTR_ALL(e.CONTENT, '\\{[a-z]+\\}')), ',')
   <> ARRAY_TO_STRING(ARRAY_SORT(REGEXP_SUBSTR_ALL(t.CONTENT, '\\{[a-z]+\\}')), ',');

-- Row counts per language (expect 78 cards and the same UI count as 'en').
SELECT 'UI_TEXT' AS T, LANGUAGE_CODE, COUNT(*) FROM TAROT.APP.UI_TEXT GROUP BY 2
UNION ALL
SELECT 'CARDS', LANGUAGE_CODE, COUNT(*) FROM TAROT.APP.CARDS GROUP BY 2
ORDER BY 1, 2;
