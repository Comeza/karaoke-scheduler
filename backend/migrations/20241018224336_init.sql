CREATE TABLE IF NOT EXISTS song (
    song_id INTEGER NOT NULL,
    artist_id INTEGER NOT NULL,
    name VARCHAR NOT NULL,

    PRIMARY KEY (song_id),
    FOREIGN KEY (artist_id) REFERENCES artist(artist_id)
);

CREATE TABLE IF NOT EXISTS artist (
    artist_id INTEGER NOT NULL,
    name VARCHAR NOT NULL,

    PRIMARY KEY (artist_id)
);

CREATE TABLE IF NOT EXISTS feature (
    song_id INTEGER NOT NULL,
    artist_id INTEGER NOT NULL,

    PRIMARY KEY (song_id, artist_id),
    FOREIGN KEY (song_id) REFERENCES song(song_id),
    FOREIGN KEY (artist_id) REFERENCES artist(artist_id)
)
