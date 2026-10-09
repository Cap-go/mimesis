-- Cards are stored in English only; the translation worker (translate/) serves every other language.
DELETE FROM guesses WHERE lang != (SELECT id FROM langs WHERE locale = 'en');
