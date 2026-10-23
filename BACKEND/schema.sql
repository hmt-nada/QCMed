-- ==============================================================================
-- Schema SQL pour QCMed (PostgreSQL / Neon)
-- Structure des tables uniquement (sans aucune donnée personnelle)
-- ==============================================================================

-- 1. Table des utilisateurs
CREATE TABLE IF NOT EXISTS utilisateurs (
    id SERIAL PRIMARY KEY,
    nom TEXT NOT NULL,
    prenom TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    mot_de_passe TEXT NOT NULL,
    faculte TEXT,
    annee TEXT,
    pseudo TEXT,
    avatar TEXT,
    email_active BOOLEAN DEFAULT false,
    email_disconnect BOOLEAN DEFAULT false,
    annee_validated BOOLEAN DEFAULT false,
    token_validation TEXT,
    email_pending TEXT,
    validation_envoyee BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Table des vérifications d'email
CREATE TABLE IF NOT EXISTS verifications_email (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL,
    token TEXT NOT NULL,
    expire TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    code TEXT,
    codeExpiration TEXT,
    resend_count INTEGER DEFAULT 0,
    last_resend INTEGER
);

-- 3. Table des facultés
CREATE TABLE IF NOT EXISTS facultes (
    id SERIAL PRIMARY KEY,
    nom TEXT NOT NULL UNIQUE
);

-- 4. Table des modules (associés à une année d'étude)
CREATE TABLE IF NOT EXISTS modules (
    id SERIAL PRIMARY KEY,
    annee INTEGER NOT NULL CHECK (annee >= 1 AND annee <= 7),
    nom TEXT NOT NULL,
    img TEXT
);

-- 5. Table des cours (associés à un module)
CREATE TABLE IF NOT EXISTS cours (
    id SERIAL PRIMARY KEY,
    module_id INTEGER NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    titre TEXT NOT NULL
);

-- 6. Table des questions QCM
CREATE TABLE IF NOT EXISTS questions (
    id SERIAL PRIMARY KEY,
    cours_id INTEGER REFERENCES cours(id) ON DELETE CASCADE,
    faculte_id INTEGER REFERENCES facultes(id) ON DELETE SET NULL,
    enonce TEXT NOT NULL,
    choix_a TEXT NOT NULL,
    choix_b TEXT NOT NULL,
    choix_c TEXT NOT NULL,
    choix_d TEXT,
    choix_e TEXT,
    choix_f TEXT,
    bonne_reponse TEXT NOT NULL, -- Ex: 'A', 'A,C', 'B,D'
    explication TEXT,
    image_url TEXT
);

-- 7. Table des questions favorites par utilisateur
CREATE TABLE IF NOT EXISTS questions_favoris (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
    question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_question UNIQUE (user_id, question_id)
);

-- 8. Table des sessions de QCM réalisées
CREATE TABLE IF NOT EXISTS sessions_qcm (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
    note NUMERIC,
    correction TEXT,
    module_id INTEGER REFERENCES modules(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Table d'historique des réponses détaillées par session
CREATE TABLE IF NOT EXISTS historique_qcm (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
    question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    reponse_choisie TEXT,
    correct BOOLEAN,
    repondu_le TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    session_id INTEGER NOT NULL REFERENCES sessions_qcm(id) ON DELETE CASCADE
);

-- ==============================================================================
-- Index recommandés pour les performances
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON utilisateurs(email);
CREATE INDEX IF NOT EXISTS idx_modules_annee ON modules(annee);
CREATE INDEX IF NOT EXISTS idx_cours_module_id ON cours(module_id);
CREATE INDEX IF NOT EXISTS idx_questions_cours_id ON questions(cours_id);
CREATE INDEX IF NOT EXISTS idx_questions_faculte_id ON questions(faculte_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions_qcm(user_id);
CREATE INDEX IF NOT EXISTS idx_historique_session_id ON historique_qcm(session_id);
CREATE INDEX IF NOT EXISTS idx_historique_user_id ON historique_qcm(user_id);
CREATE INDEX IF NOT EXISTS idx_favoris_user_id ON questions_favoris(user_id);
