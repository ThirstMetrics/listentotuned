-- ============================================================================
-- Tuned Podcast Player - PostgreSQL Schema
-- Target: Azure Database for PostgreSQL - Flexible Server
-- ============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USERS
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firebase_uid    VARCHAR(128) NOT NULL UNIQUE,
    email           VARCHAR(255),
    display_name    VARCHAR(255),
    avatar_url      TEXT,
    tier            VARCHAR(20) NOT NULL DEFAULT 'free',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users (firebase_uid);
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- ============================================================================
-- PODCASTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS podcasts (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    feed_url                TEXT NOT NULL UNIQUE,
    title                   VARCHAR(500),
    author                  VARCHAR(500),
    description             TEXT,
    artwork_url             TEXT,
    categories              TEXT[] DEFAULT '{}',
    episode_count           INTEGER DEFAULT 0,
    last_episode_date       TIMESTAMPTZ,
    last_polled_at          TIMESTAMPTZ,
    etag                    VARCHAR(255),
    last_modified           VARCHAR(255),
    poll_interval_minutes   INTEGER NOT NULL DEFAULT 60
);

CREATE INDEX IF NOT EXISTS idx_podcasts_feed_url ON podcasts (feed_url);
CREATE INDEX IF NOT EXISTS idx_podcasts_title ON podcasts USING gin (to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_podcasts_last_polled ON podcasts (last_polled_at);
CREATE INDEX IF NOT EXISTS idx_podcasts_categories ON podcasts USING gin (categories);

-- ============================================================================
-- EPISODES
-- ============================================================================
CREATE TABLE IF NOT EXISTS episodes (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    podcast_id      UUID NOT NULL REFERENCES podcasts(id) ON DELETE CASCADE,
    guid            TEXT NOT NULL,
    title           VARCHAR(500),
    description     TEXT,
    pub_date        TIMESTAMPTZ,
    duration        VARCHAR(50),
    audio_url       TEXT,
    artwork_url     TEXT,
    file_size       BIGINT DEFAULT 0,
    season          INTEGER,
    episode_number  INTEGER,

    UNIQUE (podcast_id, guid)
);

CREATE INDEX IF NOT EXISTS idx_episodes_podcast_id ON episodes (podcast_id);
CREATE INDEX IF NOT EXISTS idx_episodes_pub_date ON episodes (pub_date DESC);
CREATE INDEX IF NOT EXISTS idx_episodes_guid ON episodes (podcast_id, guid);

-- ============================================================================
-- SUBSCRIPTIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS subscriptions (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    podcast_id              UUID NOT NULL REFERENCES podcasts(id) ON DELETE CASCADE,
    subscribed_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notifications_enabled   BOOLEAN NOT NULL DEFAULT TRUE,

    UNIQUE (user_id, podcast_id)
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions (user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_podcast_id ON subscriptions (podcast_id);

-- ============================================================================
-- LISTEN HISTORY
-- ============================================================================
CREATE TABLE IF NOT EXISTS listen_history (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    episode_id  UUID NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
    position    REAL NOT NULL DEFAULT 0,
    duration    REAL NOT NULL DEFAULT 0,
    completed   BOOLEAN NOT NULL DEFAULT FALSE,
    listened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (user_id, episode_id)
);

CREATE INDEX IF NOT EXISTS idx_listen_history_user_id ON listen_history (user_id);
CREATE INDEX IF NOT EXISTS idx_listen_history_episode_id ON listen_history (episode_id);
CREATE INDEX IF NOT EXISTS idx_listen_history_updated_at ON listen_history (updated_at DESC);

-- ============================================================================
-- DOWNLOADS
-- ============================================================================
CREATE TABLE IF NOT EXISTS downloads (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    episode_id      UUID NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
    downloaded_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_downloads_user_id ON downloads (user_id);
CREATE INDEX IF NOT EXISTS idx_downloads_episode_id ON downloads (episode_id);
CREATE INDEX IF NOT EXISTS idx_downloads_downloaded_at ON downloads (downloaded_at DESC);
