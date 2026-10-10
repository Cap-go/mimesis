-- English author names that were left in French or misspelled.
UPDATE guesses SET author = 'Leonardo da Vinci' WHERE author = 'Léonard de Vinci' AND lang = (SELECT id FROM langs WHERE locale = 'en');
UPDATE guesses SET author = 'Gene Kelly and Stanley Donen' WHERE author = 'Gene Kelly et Stanley Donen' AND lang = (SELECT id FROM langs WHERE locale = 'en');
UPDATE guesses SET author = 'Mark Osborne and John Stevenson' WHERE author = 'Mark Osborne et John Stevenson' AND lang = (SELECT id FROM langs WHERE locale = 'en');
UPDATE guesses SET author = 'Steven Long Mitchell and Craig W. Van Sickle' WHERE author = 'Steven Long mitchel et Craig Van sickel' AND lang = (SELECT id FROM langs WHERE locale = 'en');
UPDATE guesses SET author = 'Brothers Grimm' WHERE author = 'frères Grimm' AND lang = (SELECT id FROM langs WHERE locale = 'en');
UPDATE guesses SET author = 'Martin Scorsese' WHERE author = 'Martin scorsese' AND lang = (SELECT id FROM langs WHERE locale = 'en');
UPDATE guesses SET author = 'Maïwenn' WHERE author = 'Mawenn' AND lang = (SELECT id FROM langs WHERE locale = 'en');
UPDATE guesses SET author = 'Hans Christian Andersen' WHERE author = 'Hans Andersen' AND lang = (SELECT id FROM langs WHERE locale = 'en');
UPDATE guesses SET author = 'The Police' WHERE author = 'Police' AND lang = (SELECT id FROM langs WHERE locale = 'en');
