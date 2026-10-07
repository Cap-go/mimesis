-- French "Improbable Plus" (mode 6) actually held the long rebus cards: move them to "Rebus Plus".
UPDATE guesses SET mode = 8 WHERE mode = 6 AND lang = (SELECT id FROM langs WHERE locale = 'fr');
UPDATE modes SET active = 1 WHERE id IN (6, 8);
-- The "Plus" themes reuse the icon of their base theme.
UPDATE modes SET icon = (SELECT icon FROM modes WHERE id = 5) WHERE id = 6;
UPDATE modes SET icon = (SELECT icon FROM modes WHERE id = 7) WHERE id = 8;
