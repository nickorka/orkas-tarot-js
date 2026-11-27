-- Add your DCM object definitions here.
-- TAROT_AGENT and TAROT_MCP are created in sources/posthooks/posthook.sql
-- (DEFINE AGENT is not yet enabled on this account).

-- ------------------------------------------------------------- compute
-- Warehouse for all app queries (SQL API) and the seed scripts.
DEFINE WAREHOUSE TAROT_WH WITH
    warehouse_size = 'XSMALL'
    auto_suspend = 60
    auto_resume = TRUE
    initially_suspended = TRUE
    comment = 'Orka''s Tarot: app queries, translations and seeding';

-- ------------------------------------------------------------ localization
-- Languages offered in the app's language picker. English ('en') is the
-- source language: UI texts and cards are authored in English and the
-- other languages are translated from it (see tarot_agent/seed/).
DEFINE TABLE TAROT.APP.LANGUAGES (
    LANGUAGE_CODE VARCHAR(10)  NOT NULL,
    NAME          VARCHAR(100) NOT NULL,
    NATIVE_NAME   VARCHAR(100) NOT NULL,
    ENABLED       BOOLEAN      NOT NULL DEFAULT TRUE,
    CONSTRAINT PK_LANGUAGES PRIMARY KEY (LANGUAGE_CODE)
)
COMMENT = 'Languages available in the Orka''s Tarot UI';

-- Static interface text: one row per UI id and language.
DEFINE TABLE TAROT.APP.UI_TEXT (
    UI_ID         VARCHAR(200) NOT NULL,
    LANGUAGE_CODE VARCHAR(10)  NOT NULL,
    CONTENT       VARCHAR      NOT NULL,
    CONSTRAINT PK_UI_TEXT PRIMARY KEY (UI_ID, LANGUAGE_CODE)
)
COMMENT = 'Static UI texts per language; ids match src/lib/i18n/en.ts';

-- Card definitions per language, same structure as the app's Card type.
DEFINE TABLE TAROT.APP.CARDS (
    CARD_ID       NUMBER(3)    NOT NULL,
    LANGUAGE_CODE VARCHAR(10)  NOT NULL,
    NAME          VARCHAR(200) NOT NULL,
    ARCANA        VARCHAR(100) NOT NULL,
    RANK          VARCHAR(50)  NOT NULL,
    KEYWORDS      VARCHAR      NOT NULL,
    MEANING       VARCHAR      NOT NULL,
    UPRIGHT       VARCHAR      NOT NULL,
    REVERSED      VARCHAR      NOT NULL,
    CONSTRAINT PK_CARDS PRIMARY KEY (CARD_ID, LANGUAGE_CODE)
)
COMMENT = 'Tarot card definitions (78 cards) per language';
