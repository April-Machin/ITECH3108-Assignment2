-- Seed data for ITECH3108_30438140_a2
-- Passwords hashed with bcrypt (cost factor 10)
--   nova_spark    -> Password123!
--   pixel_kai     -> SecurePass456!
--   dreamer_lux   -> HelloWorld789!

-- Clear existing data
TRUNCATE TABLE saved_posts, ratings, comments, friendships, posts, categories, users
  RESTART IDENTITY CASCADE;

-- Users
INSERT INTO users (username, email, password_hash, bio, profile_image, tech_points) VALUES
(
  'nova_spark',
  'nova@example.com',
  '$2b$10$/zgivyTxH910CGYupdLCCuqa3FkmxDQ/rlqZmLHHqWB1FzTo0lg5W',
  'Digital artist obsessed with generative AI and weird textures.',
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=nova_spark',
  5
),
(
  'pixel_kai',
  'kai@example.com',
  '$2b$10$6ZxyFEk70ZWm/bhoO1UalO7Jkin0MI/OR6Kmw8shtHedbdEgL5xIi',
  'Musician and sound designer exploring AI audio tools.',
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=pixel_kai',
  -2
),
(
  'dreamer_lux',
  'lux@example.com',
  '$2b$10$pcP1G0JN7abTedu.Fk8f/us2EHBzuXsTTRXT61pZakIYW2kPU97wW',
  'Writer and world-builder using AI to bring ideas to life.',
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=dreamer_lux',
  0
);

-- Categories
INSERT INTO categories (name) VALUES
('Image Generation'),
('Video Editing'),
('Music AI'),
('Writing Tools'),
('3D Modelling');

-- Posts
INSERT INTO posts (user_id, category_id, title, description, tool_url, image_url) VALUES
(
  1, 1,
  'Why I love Midjourney',
  'I have been using Midjourney for three months now and it has completely changed how I concept my work. The level of detail you can pull out with a well-crafted prompt is unreal — I generated an entire sci-fi city landscape in about 20 minutes. If you are serious about AI art this is the one to learn.',
  'https://www.midjourney.com',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Midjourney_Emblem.png/240px-Midjourney_Emblem.png'
),
(
  2, 3,
  'My experience with Suno AI',
  'I made a full lo-fi track with Suno in under five minutes — vocals, melody, even the vibe was exactly what I described. As someone who has spent years learning music production this is both terrifying and incredibly exciting. Stop sleeping on this one, the quality is genuinely shocking.',
  'https://www.suno.ai',
  NULL
),
(
  1, 4,
  'Please learn to prompt properly with ChatGPT',
  'I know everyone has heard of it but I want to advocate for actually learning how to prompt it properly. Since I started treating it like a creative collaborator rather than a search engine my output has doubled. I use it to workshop ideas, punch up descriptions, and break through creative blocks every single day.',
  'https://chat.openai.com',
  NULL
),
(
  3, 2,
  'Have you guys seenRunway Gen-2!',
  'I fed Runway a still image I painted and it generated a 4-second cinematic clip from it. I nearly fell out of my chair. The motion was smooth, the lighting held, and it looked like something out of a short film. Video generation has officially arrived — go try this right now.',
  'https://runwayml.com',
  NULL
),
(
  2, 1,
  'Adobe🤢 Firefly✨',
  'I was sceptical at first because I don''t trust Adobe as far as I can throw them. In spite of this Firefly has won me over. The generative fill inside Photoshop is seamless and the outputs are commercially licensed so I can actually use them in client work. This is the one I recommend to anyone working professionally.',
  'https://firefly.adobe.com',
  NULL
),
(
  3, 5,
  'Finally an AI for 3D modelling!!!',
  'Found this last week and I have not stopped talking about it since. You describe a 3D object, it builds it. I generated a stylised game-ready character bust in about two minutes. It is rough around the edges but the potential here is enormous — get in early and start experimenting.',
  'https://www.meshy.ai',
  NULL
);

-- Ratings
INSERT INTO ratings (post_id, user_id, is_like) VALUES
-- Post 1 (Midjourney) — all 3 users liked it
(1, 1, TRUE),
(1, 2, TRUE),
(1, 3, TRUE),
-- Post 2 (Suno AI) — liked by nova_spark, disliked by dreamer_lux
(2, 1, TRUE),
(2, 3, FALSE),
-- Post 3 (ChatGPT) — liked by pixel_kai and by dreamer_lux
(3, 2, TRUE),
(3, 3, TRUE),
-- Post 4 (Runway Gen-2) — liked by nova_spark, disliked by pixel_kai
(4, 1, TRUE),
(4, 2, FALSE),
-- Post 5 (Adobe Firefly) — Disliked by pixel_kai and dreamer_lux
(5, 2, FALSE),
(5, 3, FALSE);
-- Post 6 (Meshy AI) — no ratings (unrated)

--Hidden Posts
INSERT INTO hidden_posts (user_id, post_id) VALUES
(3, 3),
(1, 2),
(2, 4);

-- Verify
SELECT
  posts.post_id,
  posts.title,
  users.username                                         AS posted_by,
  users.tech_points,
  COUNT(*) FILTER (WHERE ratings.is_like = TRUE)         AS likes,
  COUNT(*) FILTER (WHERE ratings.is_like = FALSE)        AS dislikes
FROM posts
JOIN users ON posts.user_id = users.user_id
LEFT JOIN ratings ON posts.post_id = ratings.post_id
GROUP BY posts.post_id, posts.title, users.username, users.tech_points
ORDER BY posts.post_id;