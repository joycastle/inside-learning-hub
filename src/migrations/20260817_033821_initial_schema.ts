import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  CREATE EXTENSION IF NOT EXISTS pg_trgm;
   CREATE TYPE "public"."enum_users_role" AS ENUM('employee', 'admin', 'superAdmin');
  CREATE TYPE "public"."enum_learning_paths_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__learning_paths_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_courses_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__courses_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_units_type" AS ENUM('article', 'pdf', 'feishuDoc', 'video');
  CREATE TYPE "public"."enum_units_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__units_v_version_type" AS ENUM('article', 'pdf', 'feishuDoc', 'video');
  CREATE TYPE "public"."enum__units_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_questions_type" AS ENUM('single', 'multiple', 'trueFalse');
  CREATE TYPE "public"."enum_questions_difficulty" AS ENUM('easy', 'medium', 'hard');
  CREATE TYPE "public"."enum_questions_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__questions_v_version_type" AS ENUM('single', 'multiple', 'trueFalse');
  CREATE TYPE "public"."enum__questions_v_version_difficulty" AS ENUM('easy', 'medium', 'hard');
  CREATE TYPE "public"."enum__questions_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_enrollments_status" AS ENUM('notStarted', 'inProgress', 'completed', 'overdue');
  CREATE TYPE "public"."enum_unit_progress_status" AS ENUM('notStarted', 'inProgress', 'completed');
  CREATE TYPE "public"."enum_knowledge_articles_type" AS ENUM('article', 'pdf', 'feishuDoc', 'externalLink');
  CREATE TYPE "public"."enum_knowledge_articles_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__knowledge_articles_v_version_type" AS ENUM('article', 'pdf', 'feishuDoc', 'externalLink');
  CREATE TYPE "public"."enum__knowledge_articles_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_announcements_audience" AS ENUM('all', 'newEmployees', 'departments');
  CREATE TYPE "public"."enum_announcements_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__announcements_v_version_audience" AS ENUM('all', 'newEmployees', 'departments');
  CREATE TYPE "public"."enum__announcements_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"english_name" varchar,
  	"avatar_url" varchar,
  	"feishu_open_id" varchar,
  	"tenant_key" varchar,
  	"department_id" integer,
  	"role" "enum_users_role" DEFAULT 'employee' NOT NULL,
  	"active" boolean DEFAULT true NOT NULL,
  	"joined_at" timestamp(3) with time zone,
  	"last_synced_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "departments" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"feishu_department_id" varchar,
  	"parent_id" integer,
  	"active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"storage_key" varchar,
  	"duration_seconds" numeric,
  	"private" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "learning_paths" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"summary" varchar,
  	"default_due_days" numeric DEFAULT 7,
  	"is_default_onboarding" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_learning_paths_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "learning_paths_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"courses_id" integer
  );
  
  CREATE TABLE "_learning_paths_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_summary" varchar,
  	"version_default_due_days" numeric DEFAULT 7,
  	"version_is_default_onboarding" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__learning_paths_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_learning_paths_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"courses_id" integer
  );
  
  CREATE TABLE "courses" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"path_id" integer,
  	"order" numeric DEFAULT 0,
  	"summary" varchar,
  	"category" varchar,
  	"duration_minutes" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_courses_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "courses_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"units_id" integer
  );
  
  CREATE TABLE "_courses_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_path_id" integer,
  	"version_order" numeric DEFAULT 0,
  	"version_summary" varchar,
  	"version_category" varchar,
  	"version_duration_minutes" numeric,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__courses_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_courses_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"units_id" integer
  );
  
  CREATE TABLE "units" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"course_id" integer,
  	"order" numeric DEFAULT 0,
  	"description" varchar,
  	"type" "enum_units_type",
  	"duration_minutes" numeric,
  	"body" jsonb,
  	"media_id" integer,
  	"external_url" varchar,
  	"quiz_rule_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_units_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_units_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_course_id" integer,
  	"version_order" numeric DEFAULT 0,
  	"version_description" varchar,
  	"version_type" "enum__units_v_version_type",
  	"version_duration_minutes" numeric,
  	"version_body" jsonb,
  	"version_media_id" integer,
  	"version_external_url" varchar,
  	"version_quiz_rule_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__units_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "question_categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"description" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "questions_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"option_id" varchar NOT NULL,
  	"label" varchar NOT NULL,
  	"correct" boolean DEFAULT false
  );
  
  CREATE TABLE "questions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"course_id" integer NOT NULL,
  	"category_id" integer NOT NULL,
  	"type" "enum_questions_type" NOT NULL,
  	"prompt" varchar NOT NULL,
  	"explanation" varchar NOT NULL,
  	"difficulty" "enum_questions_difficulty" DEFAULT 'easy',
  	"active" boolean DEFAULT true,
  	"status" "enum_questions_status" DEFAULT 'published',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_questions_v_version_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"option_id" varchar NOT NULL,
  	"label" varchar NOT NULL,
  	"correct" boolean DEFAULT false,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_questions_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_course_id" integer NOT NULL,
  	"version_category_id" integer NOT NULL,
  	"version_type" "enum__questions_v_version_type" NOT NULL,
  	"version_prompt" varchar NOT NULL,
  	"version_explanation" varchar NOT NULL,
  	"version_difficulty" "enum__questions_v_version_difficulty" DEFAULT 'easy',
  	"version_active" boolean DEFAULT true,
  	"version_status" "enum__questions_v_version_status" DEFAULT 'published',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "quiz_rules" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"question_count" numeric DEFAULT 3 NOT NULL,
  	"pass_score" numeric DEFAULT 80 NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "quiz_rules_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"question_categories_id" integer
  );
  
  CREATE TABLE "enrollments" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer NOT NULL,
  	"learning_path_id" integer NOT NULL,
  	"assigned_at" timestamp(3) with time zone NOT NULL,
  	"due_at" timestamp(3) with time zone NOT NULL,
  	"status" "enum_enrollments_status" DEFAULT 'notStarted',
  	"completed_at" timestamp(3) with time zone,
  	"assignment_key" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "unit_progress" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer NOT NULL,
  	"unit_id" integer NOT NULL,
  	"status" "enum_unit_progress_status" DEFAULT 'notStarted',
  	"progress" numeric DEFAULT 0,
  	"completed_at" timestamp(3) with time zone,
  	"progress_key" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "video_progress" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer NOT NULL,
  	"unit_id" integer NOT NULL,
  	"first_played_at" timestamp(3) with time zone,
  	"last_played_at" timestamp(3) with time zone,
  	"current_seconds" numeric,
  	"max_seconds" numeric,
  	"watched_seconds" numeric,
  	"max_progress" numeric,
  	"completed" boolean DEFAULT false,
  	"completed_at" timestamp(3) with time zone,
  	"progress_key" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "video_playback_sessions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer NOT NULL,
  	"unit_id" integer NOT NULL,
  	"session_id" varchar NOT NULL,
  	"last_sequence" numeric NOT NULL,
  	"last_reported_at" timestamp(3) with time zone NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "quiz_attempts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer NOT NULL,
  	"unit_id" integer NOT NULL,
  	"question_snapshot" jsonb NOT NULL,
  	"answers_snapshot" jsonb,
  	"score" numeric,
  	"passed" boolean,
  	"started_at" timestamp(3) with time zone NOT NULL,
  	"submitted_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "quiz_attempt_items" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"attempt_id" integer NOT NULL,
  	"question_id" varchar NOT NULL,
  	"question_snapshot" jsonb NOT NULL,
  	"selected_option_ids" jsonb NOT NULL,
  	"correct" boolean DEFAULT false NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "service_categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"order" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "knowledge_articles_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar
  );
  
  CREATE TABLE "knowledge_articles" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"summary" varchar,
  	"type" "enum_knowledge_articles_type" DEFAULT 'article',
  	"body_text" varchar,
  	"source" varchar,
  	"status" "enum_knowledge_articles_status" DEFAULT 'published',
  	"category_id" integer,
  	"body" jsonb,
  	"media_id" integer,
  	"external_url" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_knowledge_articles_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_knowledge_articles_v_version_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_knowledge_articles_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_summary" varchar,
  	"version_type" "enum__knowledge_articles_v_version_type" DEFAULT 'article',
  	"version_body_text" varchar,
  	"version_source" varchar,
  	"version_status" "enum__knowledge_articles_v_version_status" DEFAULT 'published',
  	"version_category_id" integer,
  	"version_body" jsonb,
  	"version_media_id" integer,
  	"version_external_url" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__knowledge_articles_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "service_links" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"category_id" integer,
  	"url" varchar NOT NULL,
  	"order" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "announcements" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"summary" varchar,
  	"audience" "enum_announcements_audience" DEFAULT 'all',
  	"starts_at" timestamp(3) with time zone,
  	"ends_at" timestamp(3) with time zone,
  	"target_url" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_announcements_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "announcements_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"departments_id" integer
  );
  
  CREATE TABLE "_announcements_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_summary" varchar,
  	"version_audience" "enum__announcements_v_version_audience" DEFAULT 'all',
  	"version_starts_at" timestamp(3) with time zone,
  	"version_ends_at" timestamp(3) with time zone,
  	"version_target_url" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__announcements_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_announcements_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"departments_id" integer
  );
  
  CREATE TABLE "feishu_events" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"event_id" varchar NOT NULL,
  	"event_type" varchar NOT NULL,
  	"tenant_key" varchar,
  	"payload" jsonb NOT NULL,
  	"processed_at" timestamp(3) with time zone NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"departments_id" integer,
  	"media_id" integer,
  	"learning_paths_id" integer,
  	"courses_id" integer,
  	"units_id" integer,
  	"question_categories_id" integer,
  	"questions_id" integer,
  	"quiz_rules_id" integer,
  	"enrollments_id" integer,
  	"unit_progress_id" integer,
  	"video_progress_id" integer,
  	"video_playback_sessions_id" integer,
  	"quiz_attempts_id" integer,
  	"quiz_attempt_items_id" integer,
  	"service_categories_id" integer,
  	"knowledge_articles_id" integer,
  	"service_links_id" integer,
  	"announcements_id" integer,
  	"feishu_events_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users" ADD CONSTRAINT "users_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "departments" ADD CONSTRAINT "departments_parent_id_departments_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "learning_paths_rels" ADD CONSTRAINT "learning_paths_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."learning_paths"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "learning_paths_rels" ADD CONSTRAINT "learning_paths_rels_courses_fk" FOREIGN KEY ("courses_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_learning_paths_v" ADD CONSTRAINT "_learning_paths_v_parent_id_learning_paths_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."learning_paths"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_learning_paths_v_rels" ADD CONSTRAINT "_learning_paths_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_learning_paths_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_learning_paths_v_rels" ADD CONSTRAINT "_learning_paths_v_rels_courses_fk" FOREIGN KEY ("courses_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses" ADD CONSTRAINT "courses_path_id_learning_paths_id_fk" FOREIGN KEY ("path_id") REFERENCES "public"."learning_paths"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "courses_rels" ADD CONSTRAINT "courses_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_rels" ADD CONSTRAINT "courses_rels_units_fk" FOREIGN KEY ("units_id") REFERENCES "public"."units"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v" ADD CONSTRAINT "_courses_v_parent_id_courses_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_courses_v" ADD CONSTRAINT "_courses_v_version_path_id_learning_paths_id_fk" FOREIGN KEY ("version_path_id") REFERENCES "public"."learning_paths"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_courses_v_rels" ADD CONSTRAINT "_courses_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_courses_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_rels" ADD CONSTRAINT "_courses_v_rels_units_fk" FOREIGN KEY ("units_id") REFERENCES "public"."units"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "units" ADD CONSTRAINT "units_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "units" ADD CONSTRAINT "units_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "units" ADD CONSTRAINT "units_quiz_rule_id_quiz_rules_id_fk" FOREIGN KEY ("quiz_rule_id") REFERENCES "public"."quiz_rules"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_units_v" ADD CONSTRAINT "_units_v_parent_id_units_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."units"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_units_v" ADD CONSTRAINT "_units_v_version_course_id_courses_id_fk" FOREIGN KEY ("version_course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_units_v" ADD CONSTRAINT "_units_v_version_media_id_media_id_fk" FOREIGN KEY ("version_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_units_v" ADD CONSTRAINT "_units_v_version_quiz_rule_id_quiz_rules_id_fk" FOREIGN KEY ("version_quiz_rule_id") REFERENCES "public"."quiz_rules"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "questions_options" ADD CONSTRAINT "questions_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "questions" ADD CONSTRAINT "questions_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "questions" ADD CONSTRAINT "questions_category_id_question_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."question_categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_questions_v_version_options" ADD CONSTRAINT "_questions_v_version_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_questions_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_questions_v" ADD CONSTRAINT "_questions_v_parent_id_questions_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."questions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_questions_v" ADD CONSTRAINT "_questions_v_version_course_id_courses_id_fk" FOREIGN KEY ("version_course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_questions_v" ADD CONSTRAINT "_questions_v_version_category_id_question_categories_id_fk" FOREIGN KEY ("version_category_id") REFERENCES "public"."question_categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "quiz_rules_rels" ADD CONSTRAINT "quiz_rules_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."quiz_rules"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "quiz_rules_rels" ADD CONSTRAINT "quiz_rules_rels_question_categories_fk" FOREIGN KEY ("question_categories_id") REFERENCES "public"."question_categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_learning_path_id_learning_paths_id_fk" FOREIGN KEY ("learning_path_id") REFERENCES "public"."learning_paths"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "unit_progress" ADD CONSTRAINT "unit_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "unit_progress" ADD CONSTRAINT "unit_progress_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "video_progress" ADD CONSTRAINT "video_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "video_progress" ADD CONSTRAINT "video_progress_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "video_playback_sessions" ADD CONSTRAINT "video_playback_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "video_playback_sessions" ADD CONSTRAINT "video_playback_sessions_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "quiz_attempt_items" ADD CONSTRAINT "quiz_attempt_items_attempt_id_quiz_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."quiz_attempts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "knowledge_articles_tags" ADD CONSTRAINT "knowledge_articles_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."knowledge_articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "knowledge_articles" ADD CONSTRAINT "knowledge_articles_category_id_service_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."service_categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "knowledge_articles" ADD CONSTRAINT "knowledge_articles_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_knowledge_articles_v_version_tags" ADD CONSTRAINT "_knowledge_articles_v_version_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_knowledge_articles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_knowledge_articles_v" ADD CONSTRAINT "_knowledge_articles_v_parent_id_knowledge_articles_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."knowledge_articles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_knowledge_articles_v" ADD CONSTRAINT "_knowledge_articles_v_version_category_id_service_categories_id_fk" FOREIGN KEY ("version_category_id") REFERENCES "public"."service_categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_knowledge_articles_v" ADD CONSTRAINT "_knowledge_articles_v_version_media_id_media_id_fk" FOREIGN KEY ("version_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "service_links" ADD CONSTRAINT "service_links_category_id_service_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."service_categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "announcements_rels" ADD CONSTRAINT "announcements_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."announcements"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "announcements_rels" ADD CONSTRAINT "announcements_rels_departments_fk" FOREIGN KEY ("departments_id") REFERENCES "public"."departments"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_announcements_v" ADD CONSTRAINT "_announcements_v_parent_id_announcements_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."announcements"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_announcements_v_rels" ADD CONSTRAINT "_announcements_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_announcements_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_announcements_v_rels" ADD CONSTRAINT "_announcements_v_rels_departments_fk" FOREIGN KEY ("departments_id") REFERENCES "public"."departments"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_departments_fk" FOREIGN KEY ("departments_id") REFERENCES "public"."departments"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_learning_paths_fk" FOREIGN KEY ("learning_paths_id") REFERENCES "public"."learning_paths"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_courses_fk" FOREIGN KEY ("courses_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_units_fk" FOREIGN KEY ("units_id") REFERENCES "public"."units"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_question_categories_fk" FOREIGN KEY ("question_categories_id") REFERENCES "public"."question_categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_questions_fk" FOREIGN KEY ("questions_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_quiz_rules_fk" FOREIGN KEY ("quiz_rules_id") REFERENCES "public"."quiz_rules"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_enrollments_fk" FOREIGN KEY ("enrollments_id") REFERENCES "public"."enrollments"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_unit_progress_fk" FOREIGN KEY ("unit_progress_id") REFERENCES "public"."unit_progress"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_video_progress_fk" FOREIGN KEY ("video_progress_id") REFERENCES "public"."video_progress"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_video_playback_sessions_fk" FOREIGN KEY ("video_playback_sessions_id") REFERENCES "public"."video_playback_sessions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_quiz_attempts_fk" FOREIGN KEY ("quiz_attempts_id") REFERENCES "public"."quiz_attempts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_quiz_attempt_items_fk" FOREIGN KEY ("quiz_attempt_items_id") REFERENCES "public"."quiz_attempt_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_service_categories_fk" FOREIGN KEY ("service_categories_id") REFERENCES "public"."service_categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_knowledge_articles_fk" FOREIGN KEY ("knowledge_articles_id") REFERENCES "public"."knowledge_articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_service_links_fk" FOREIGN KEY ("service_links_id") REFERENCES "public"."service_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_announcements_fk" FOREIGN KEY ("announcements_id") REFERENCES "public"."announcements"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_feishu_events_fk" FOREIGN KEY ("feishu_events_id") REFERENCES "public"."feishu_events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "users_feishu_open_id_idx" ON "users" USING btree ("feishu_open_id");
  CREATE INDEX "users_tenant_key_idx" ON "users" USING btree ("tenant_key");
  CREATE INDEX "users_department_idx" ON "users" USING btree ("department_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE UNIQUE INDEX "departments_feishu_department_id_idx" ON "departments" USING btree ("feishu_department_id");
  CREATE INDEX "departments_parent_idx" ON "departments" USING btree ("parent_id");
  CREATE INDEX "departments_updated_at_idx" ON "departments" USING btree ("updated_at");
  CREATE INDEX "departments_created_at_idx" ON "departments" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_storage_key_idx" ON "media" USING btree ("storage_key");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE UNIQUE INDEX "learning_paths_slug_idx" ON "learning_paths" USING btree ("slug");
  CREATE INDEX "learning_paths_updated_at_idx" ON "learning_paths" USING btree ("updated_at");
  CREATE INDEX "learning_paths_created_at_idx" ON "learning_paths" USING btree ("created_at");
  CREATE INDEX "learning_paths__status_idx" ON "learning_paths" USING btree ("_status");
  CREATE INDEX "learning_paths_rels_order_idx" ON "learning_paths_rels" USING btree ("order");
  CREATE INDEX "learning_paths_rels_parent_idx" ON "learning_paths_rels" USING btree ("parent_id");
  CREATE INDEX "learning_paths_rels_path_idx" ON "learning_paths_rels" USING btree ("path");
  CREATE INDEX "learning_paths_rels_courses_id_idx" ON "learning_paths_rels" USING btree ("courses_id");
  CREATE INDEX "_learning_paths_v_parent_idx" ON "_learning_paths_v" USING btree ("parent_id");
  CREATE INDEX "_learning_paths_v_version_version_slug_idx" ON "_learning_paths_v" USING btree ("version_slug");
  CREATE INDEX "_learning_paths_v_version_version_updated_at_idx" ON "_learning_paths_v" USING btree ("version_updated_at");
  CREATE INDEX "_learning_paths_v_version_version_created_at_idx" ON "_learning_paths_v" USING btree ("version_created_at");
  CREATE INDEX "_learning_paths_v_version_version__status_idx" ON "_learning_paths_v" USING btree ("version__status");
  CREATE INDEX "_learning_paths_v_created_at_idx" ON "_learning_paths_v" USING btree ("created_at");
  CREATE INDEX "_learning_paths_v_updated_at_idx" ON "_learning_paths_v" USING btree ("updated_at");
  CREATE INDEX "_learning_paths_v_latest_idx" ON "_learning_paths_v" USING btree ("latest");
  CREATE INDEX "_learning_paths_v_autosave_idx" ON "_learning_paths_v" USING btree ("autosave");
  CREATE INDEX "_learning_paths_v_rels_order_idx" ON "_learning_paths_v_rels" USING btree ("order");
  CREATE INDEX "_learning_paths_v_rels_parent_idx" ON "_learning_paths_v_rels" USING btree ("parent_id");
  CREATE INDEX "_learning_paths_v_rels_path_idx" ON "_learning_paths_v_rels" USING btree ("path");
  CREATE INDEX "_learning_paths_v_rels_courses_id_idx" ON "_learning_paths_v_rels" USING btree ("courses_id");
  CREATE UNIQUE INDEX "courses_slug_idx" ON "courses" USING btree ("slug");
  CREATE INDEX "courses_path_idx" ON "courses" USING btree ("path_id");
  CREATE INDEX "courses_updated_at_idx" ON "courses" USING btree ("updated_at");
  CREATE INDEX "courses_created_at_idx" ON "courses" USING btree ("created_at");
  CREATE INDEX "courses__status_idx" ON "courses" USING btree ("_status");
  CREATE INDEX "courses_rels_order_idx" ON "courses_rels" USING btree ("order");
  CREATE INDEX "courses_rels_parent_idx" ON "courses_rels" USING btree ("parent_id");
  CREATE INDEX "courses_rels_path_idx" ON "courses_rels" USING btree ("path");
  CREATE INDEX "courses_rels_units_id_idx" ON "courses_rels" USING btree ("units_id");
  CREATE INDEX "_courses_v_parent_idx" ON "_courses_v" USING btree ("parent_id");
  CREATE INDEX "_courses_v_version_version_slug_idx" ON "_courses_v" USING btree ("version_slug");
  CREATE INDEX "_courses_v_version_version_path_idx" ON "_courses_v" USING btree ("version_path_id");
  CREATE INDEX "_courses_v_version_version_updated_at_idx" ON "_courses_v" USING btree ("version_updated_at");
  CREATE INDEX "_courses_v_version_version_created_at_idx" ON "_courses_v" USING btree ("version_created_at");
  CREATE INDEX "_courses_v_version_version__status_idx" ON "_courses_v" USING btree ("version__status");
  CREATE INDEX "_courses_v_created_at_idx" ON "_courses_v" USING btree ("created_at");
  CREATE INDEX "_courses_v_updated_at_idx" ON "_courses_v" USING btree ("updated_at");
  CREATE INDEX "_courses_v_latest_idx" ON "_courses_v" USING btree ("latest");
  CREATE INDEX "_courses_v_autosave_idx" ON "_courses_v" USING btree ("autosave");
  CREATE INDEX "_courses_v_rels_order_idx" ON "_courses_v_rels" USING btree ("order");
  CREATE INDEX "_courses_v_rels_parent_idx" ON "_courses_v_rels" USING btree ("parent_id");
  CREATE INDEX "_courses_v_rels_path_idx" ON "_courses_v_rels" USING btree ("path");
  CREATE INDEX "_courses_v_rels_units_id_idx" ON "_courses_v_rels" USING btree ("units_id");
  CREATE INDEX "units_course_idx" ON "units" USING btree ("course_id");
  CREATE INDEX "units_media_idx" ON "units" USING btree ("media_id");
  CREATE INDEX "units_quiz_rule_idx" ON "units" USING btree ("quiz_rule_id");
  CREATE INDEX "units_updated_at_idx" ON "units" USING btree ("updated_at");
  CREATE INDEX "units_created_at_idx" ON "units" USING btree ("created_at");
  CREATE INDEX "units__status_idx" ON "units" USING btree ("_status");
  CREATE INDEX "_units_v_parent_idx" ON "_units_v" USING btree ("parent_id");
  CREATE INDEX "_units_v_version_version_course_idx" ON "_units_v" USING btree ("version_course_id");
  CREATE INDEX "_units_v_version_version_media_idx" ON "_units_v" USING btree ("version_media_id");
  CREATE INDEX "_units_v_version_version_quiz_rule_idx" ON "_units_v" USING btree ("version_quiz_rule_id");
  CREATE INDEX "_units_v_version_version_updated_at_idx" ON "_units_v" USING btree ("version_updated_at");
  CREATE INDEX "_units_v_version_version_created_at_idx" ON "_units_v" USING btree ("version_created_at");
  CREATE INDEX "_units_v_version_version__status_idx" ON "_units_v" USING btree ("version__status");
  CREATE INDEX "_units_v_created_at_idx" ON "_units_v" USING btree ("created_at");
  CREATE INDEX "_units_v_updated_at_idx" ON "_units_v" USING btree ("updated_at");
  CREATE INDEX "_units_v_latest_idx" ON "_units_v" USING btree ("latest");
  CREATE INDEX "_units_v_autosave_idx" ON "_units_v" USING btree ("autosave");
  CREATE INDEX "question_categories_updated_at_idx" ON "question_categories" USING btree ("updated_at");
  CREATE INDEX "question_categories_created_at_idx" ON "question_categories" USING btree ("created_at");
  CREATE INDEX "questions_options_order_idx" ON "questions_options" USING btree ("_order");
  CREATE INDEX "questions_options_parent_id_idx" ON "questions_options" USING btree ("_parent_id");
  CREATE INDEX "questions_course_idx" ON "questions" USING btree ("course_id");
  CREATE INDEX "questions_category_idx" ON "questions" USING btree ("category_id");
  CREATE INDEX "questions_updated_at_idx" ON "questions" USING btree ("updated_at");
  CREATE INDEX "questions_created_at_idx" ON "questions" USING btree ("created_at");
  CREATE INDEX "_questions_v_version_options_order_idx" ON "_questions_v_version_options" USING btree ("_order");
  CREATE INDEX "_questions_v_version_options_parent_id_idx" ON "_questions_v_version_options" USING btree ("_parent_id");
  CREATE INDEX "_questions_v_parent_idx" ON "_questions_v" USING btree ("parent_id");
  CREATE INDEX "_questions_v_version_version_course_idx" ON "_questions_v" USING btree ("version_course_id");
  CREATE INDEX "_questions_v_version_version_category_idx" ON "_questions_v" USING btree ("version_category_id");
  CREATE INDEX "_questions_v_version_version_updated_at_idx" ON "_questions_v" USING btree ("version_updated_at");
  CREATE INDEX "_questions_v_version_version_created_at_idx" ON "_questions_v" USING btree ("version_created_at");
  CREATE INDEX "_questions_v_created_at_idx" ON "_questions_v" USING btree ("created_at");
  CREATE INDEX "_questions_v_updated_at_idx" ON "_questions_v" USING btree ("updated_at");
  CREATE INDEX "quiz_rules_updated_at_idx" ON "quiz_rules" USING btree ("updated_at");
  CREATE INDEX "quiz_rules_created_at_idx" ON "quiz_rules" USING btree ("created_at");
  CREATE INDEX "quiz_rules_rels_order_idx" ON "quiz_rules_rels" USING btree ("order");
  CREATE INDEX "quiz_rules_rels_parent_idx" ON "quiz_rules_rels" USING btree ("parent_id");
  CREATE INDEX "quiz_rules_rels_path_idx" ON "quiz_rules_rels" USING btree ("path");
  CREATE INDEX "quiz_rules_rels_question_categories_id_idx" ON "quiz_rules_rels" USING btree ("question_categories_id");
  CREATE INDEX "enrollments_user_idx" ON "enrollments" USING btree ("user_id");
  CREATE INDEX "enrollments_learning_path_idx" ON "enrollments" USING btree ("learning_path_id");
  CREATE INDEX "enrollments_due_at_idx" ON "enrollments" USING btree ("due_at");
  CREATE INDEX "enrollments_status_idx" ON "enrollments" USING btree ("status");
  CREATE UNIQUE INDEX "enrollments_assignment_key_idx" ON "enrollments" USING btree ("assignment_key");
  CREATE INDEX "enrollments_updated_at_idx" ON "enrollments" USING btree ("updated_at");
  CREATE INDEX "enrollments_created_at_idx" ON "enrollments" USING btree ("created_at");
  CREATE INDEX "unit_progress_user_idx" ON "unit_progress" USING btree ("user_id");
  CREATE INDEX "unit_progress_unit_idx" ON "unit_progress" USING btree ("unit_id");
  CREATE UNIQUE INDEX "unit_progress_progress_key_idx" ON "unit_progress" USING btree ("progress_key");
  CREATE INDEX "unit_progress_updated_at_idx" ON "unit_progress" USING btree ("updated_at");
  CREATE INDEX "unit_progress_created_at_idx" ON "unit_progress" USING btree ("created_at");
  CREATE INDEX "video_progress_user_idx" ON "video_progress" USING btree ("user_id");
  CREATE INDEX "video_progress_unit_idx" ON "video_progress" USING btree ("unit_id");
  CREATE INDEX "video_progress_last_played_at_idx" ON "video_progress" USING btree ("last_played_at");
  CREATE INDEX "video_progress_max_progress_idx" ON "video_progress" USING btree ("max_progress");
  CREATE INDEX "video_progress_completed_idx" ON "video_progress" USING btree ("completed");
  CREATE UNIQUE INDEX "video_progress_progress_key_idx" ON "video_progress" USING btree ("progress_key");
  CREATE INDEX "video_progress_updated_at_idx" ON "video_progress" USING btree ("updated_at");
  CREATE INDEX "video_progress_created_at_idx" ON "video_progress" USING btree ("created_at");
  CREATE INDEX "video_playback_sessions_user_idx" ON "video_playback_sessions" USING btree ("user_id");
  CREATE INDEX "video_playback_sessions_unit_idx" ON "video_playback_sessions" USING btree ("unit_id");
  CREATE INDEX "video_playback_sessions_session_id_idx" ON "video_playback_sessions" USING btree ("session_id");
  CREATE INDEX "video_playback_sessions_updated_at_idx" ON "video_playback_sessions" USING btree ("updated_at");
  CREATE INDEX "video_playback_sessions_created_at_idx" ON "video_playback_sessions" USING btree ("created_at");
  CREATE INDEX "quiz_attempts_user_idx" ON "quiz_attempts" USING btree ("user_id");
  CREATE INDEX "quiz_attempts_unit_idx" ON "quiz_attempts" USING btree ("unit_id");
  CREATE INDEX "quiz_attempts_updated_at_idx" ON "quiz_attempts" USING btree ("updated_at");
  CREATE INDEX "quiz_attempts_created_at_idx" ON "quiz_attempts" USING btree ("created_at");
  CREATE INDEX "quiz_attempt_items_attempt_idx" ON "quiz_attempt_items" USING btree ("attempt_id");
  CREATE INDEX "quiz_attempt_items_updated_at_idx" ON "quiz_attempt_items" USING btree ("updated_at");
  CREATE INDEX "quiz_attempt_items_created_at_idx" ON "quiz_attempt_items" USING btree ("created_at");
  CREATE UNIQUE INDEX "service_categories_slug_idx" ON "service_categories" USING btree ("slug");
  CREATE INDEX "service_categories_updated_at_idx" ON "service_categories" USING btree ("updated_at");
  CREATE INDEX "service_categories_created_at_idx" ON "service_categories" USING btree ("created_at");
  CREATE INDEX "knowledge_articles_tags_order_idx" ON "knowledge_articles_tags" USING btree ("_order");
  CREATE INDEX "knowledge_articles_tags_parent_id_idx" ON "knowledge_articles_tags" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "knowledge_articles_slug_idx" ON "knowledge_articles" USING btree ("slug");
  CREATE INDEX "knowledge_articles_category_idx" ON "knowledge_articles" USING btree ("category_id");
  CREATE INDEX "knowledge_articles_media_idx" ON "knowledge_articles" USING btree ("media_id");
  CREATE INDEX "knowledge_articles_updated_at_idx" ON "knowledge_articles" USING btree ("updated_at");
  CREATE INDEX "knowledge_articles_created_at_idx" ON "knowledge_articles" USING btree ("created_at");
  CREATE INDEX "knowledge_articles__status_idx" ON "knowledge_articles" USING btree ("_status");
  CREATE INDEX "_knowledge_articles_v_version_tags_order_idx" ON "_knowledge_articles_v_version_tags" USING btree ("_order");
  CREATE INDEX "_knowledge_articles_v_version_tags_parent_id_idx" ON "_knowledge_articles_v_version_tags" USING btree ("_parent_id");
  CREATE INDEX "_knowledge_articles_v_parent_idx" ON "_knowledge_articles_v" USING btree ("parent_id");
  CREATE INDEX "_knowledge_articles_v_version_version_slug_idx" ON "_knowledge_articles_v" USING btree ("version_slug");
  CREATE INDEX "_knowledge_articles_v_version_version_category_idx" ON "_knowledge_articles_v" USING btree ("version_category_id");
  CREATE INDEX "_knowledge_articles_v_version_version_media_idx" ON "_knowledge_articles_v" USING btree ("version_media_id");
  CREATE INDEX "_knowledge_articles_v_version_version_updated_at_idx" ON "_knowledge_articles_v" USING btree ("version_updated_at");
  CREATE INDEX "_knowledge_articles_v_version_version_created_at_idx" ON "_knowledge_articles_v" USING btree ("version_created_at");
  CREATE INDEX "_knowledge_articles_v_version_version__status_idx" ON "_knowledge_articles_v" USING btree ("version__status");
  CREATE INDEX "_knowledge_articles_v_created_at_idx" ON "_knowledge_articles_v" USING btree ("created_at");
  CREATE INDEX "_knowledge_articles_v_updated_at_idx" ON "_knowledge_articles_v" USING btree ("updated_at");
  CREATE INDEX "_knowledge_articles_v_latest_idx" ON "_knowledge_articles_v" USING btree ("latest");
  CREATE INDEX "_knowledge_articles_v_autosave_idx" ON "_knowledge_articles_v" USING btree ("autosave");
  CREATE INDEX "service_links_category_idx" ON "service_links" USING btree ("category_id");
  CREATE INDEX "service_links_updated_at_idx" ON "service_links" USING btree ("updated_at");
  CREATE INDEX "service_links_created_at_idx" ON "service_links" USING btree ("created_at");
  CREATE INDEX "announcements_updated_at_idx" ON "announcements" USING btree ("updated_at");
  CREATE INDEX "announcements_created_at_idx" ON "announcements" USING btree ("created_at");
  CREATE INDEX "announcements__status_idx" ON "announcements" USING btree ("_status");
  CREATE INDEX "announcements_rels_order_idx" ON "announcements_rels" USING btree ("order");
  CREATE INDEX "announcements_rels_parent_idx" ON "announcements_rels" USING btree ("parent_id");
  CREATE INDEX "announcements_rels_path_idx" ON "announcements_rels" USING btree ("path");
  CREATE INDEX "announcements_rels_departments_id_idx" ON "announcements_rels" USING btree ("departments_id");
  CREATE INDEX "_announcements_v_parent_idx" ON "_announcements_v" USING btree ("parent_id");
  CREATE INDEX "_announcements_v_version_version_updated_at_idx" ON "_announcements_v" USING btree ("version_updated_at");
  CREATE INDEX "_announcements_v_version_version_created_at_idx" ON "_announcements_v" USING btree ("version_created_at");
  CREATE INDEX "_announcements_v_version_version__status_idx" ON "_announcements_v" USING btree ("version__status");
  CREATE INDEX "_announcements_v_created_at_idx" ON "_announcements_v" USING btree ("created_at");
  CREATE INDEX "_announcements_v_updated_at_idx" ON "_announcements_v" USING btree ("updated_at");
  CREATE INDEX "_announcements_v_latest_idx" ON "_announcements_v" USING btree ("latest");
  CREATE INDEX "_announcements_v_autosave_idx" ON "_announcements_v" USING btree ("autosave");
  CREATE INDEX "_announcements_v_rels_order_idx" ON "_announcements_v_rels" USING btree ("order");
  CREATE INDEX "_announcements_v_rels_parent_idx" ON "_announcements_v_rels" USING btree ("parent_id");
  CREATE INDEX "_announcements_v_rels_path_idx" ON "_announcements_v_rels" USING btree ("path");
  CREATE INDEX "_announcements_v_rels_departments_id_idx" ON "_announcements_v_rels" USING btree ("departments_id");
  CREATE UNIQUE INDEX "feishu_events_event_id_idx" ON "feishu_events" USING btree ("event_id");
  CREATE INDEX "feishu_events_event_type_idx" ON "feishu_events" USING btree ("event_type");
  CREATE INDEX "feishu_events_tenant_key_idx" ON "feishu_events" USING btree ("tenant_key");
  CREATE INDEX "feishu_events_updated_at_idx" ON "feishu_events" USING btree ("updated_at");
  CREATE INDEX "feishu_events_created_at_idx" ON "feishu_events" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_departments_id_idx" ON "payload_locked_documents_rels" USING btree ("departments_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_learning_paths_id_idx" ON "payload_locked_documents_rels" USING btree ("learning_paths_id");
  CREATE INDEX "payload_locked_documents_rels_courses_id_idx" ON "payload_locked_documents_rels" USING btree ("courses_id");
  CREATE INDEX "payload_locked_documents_rels_units_id_idx" ON "payload_locked_documents_rels" USING btree ("units_id");
  CREATE INDEX "payload_locked_documents_rels_question_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("question_categories_id");
  CREATE INDEX "payload_locked_documents_rels_questions_id_idx" ON "payload_locked_documents_rels" USING btree ("questions_id");
  CREATE INDEX "payload_locked_documents_rels_quiz_rules_id_idx" ON "payload_locked_documents_rels" USING btree ("quiz_rules_id");
  CREATE INDEX "payload_locked_documents_rels_enrollments_id_idx" ON "payload_locked_documents_rels" USING btree ("enrollments_id");
  CREATE INDEX "payload_locked_documents_rels_unit_progress_id_idx" ON "payload_locked_documents_rels" USING btree ("unit_progress_id");
  CREATE INDEX "payload_locked_documents_rels_video_progress_id_idx" ON "payload_locked_documents_rels" USING btree ("video_progress_id");
  CREATE INDEX "payload_locked_documents_rels_video_playback_sessions_id_idx" ON "payload_locked_documents_rels" USING btree ("video_playback_sessions_id");
  CREATE INDEX "payload_locked_documents_rels_quiz_attempts_id_idx" ON "payload_locked_documents_rels" USING btree ("quiz_attempts_id");
  CREATE INDEX "payload_locked_documents_rels_quiz_attempt_items_id_idx" ON "payload_locked_documents_rels" USING btree ("quiz_attempt_items_id");
  CREATE INDEX "payload_locked_documents_rels_service_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("service_categories_id");
  CREATE INDEX "payload_locked_documents_rels_knowledge_articles_id_idx" ON "payload_locked_documents_rels" USING btree ("knowledge_articles_id");
  CREATE INDEX "payload_locked_documents_rels_service_links_id_idx" ON "payload_locked_documents_rels" USING btree ("service_links_id");
  CREATE INDEX "payload_locked_documents_rels_announcements_id_idx" ON "payload_locked_documents_rels" USING btree ("announcements_id");
  CREATE INDEX "payload_locked_documents_rels_feishu_events_id_idx" ON "payload_locked_documents_rels" USING btree ("feishu_events_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX "learning_paths_title_trgm_idx" ON "learning_paths" USING gin ("title" gin_trgm_ops);
  CREATE INDEX "courses_title_trgm_idx" ON "courses" USING gin ("title" gin_trgm_ops);
  CREATE INDEX "units_title_trgm_idx" ON "units" USING gin ("title" gin_trgm_ops);
  CREATE INDEX "knowledge_articles_title_trgm_idx" ON "knowledge_articles" USING gin ("title" gin_trgm_ops);
  CREATE INDEX "knowledge_articles_summary_trgm_idx" ON "knowledge_articles" USING gin ("summary" gin_trgm_ops);`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "departments" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "learning_paths" CASCADE;
  DROP TABLE "learning_paths_rels" CASCADE;
  DROP TABLE "_learning_paths_v" CASCADE;
  DROP TABLE "_learning_paths_v_rels" CASCADE;
  DROP TABLE "courses" CASCADE;
  DROP TABLE "courses_rels" CASCADE;
  DROP TABLE "_courses_v" CASCADE;
  DROP TABLE "_courses_v_rels" CASCADE;
  DROP TABLE "units" CASCADE;
  DROP TABLE "_units_v" CASCADE;
  DROP TABLE "question_categories" CASCADE;
  DROP TABLE "questions_options" CASCADE;
  DROP TABLE "questions" CASCADE;
  DROP TABLE "_questions_v_version_options" CASCADE;
  DROP TABLE "_questions_v" CASCADE;
  DROP TABLE "quiz_rules" CASCADE;
  DROP TABLE "quiz_rules_rels" CASCADE;
  DROP TABLE "enrollments" CASCADE;
  DROP TABLE "unit_progress" CASCADE;
  DROP TABLE "video_progress" CASCADE;
  DROP TABLE "video_playback_sessions" CASCADE;
  DROP TABLE "quiz_attempts" CASCADE;
  DROP TABLE "quiz_attempt_items" CASCADE;
  DROP TABLE "service_categories" CASCADE;
  DROP TABLE "knowledge_articles_tags" CASCADE;
  DROP TABLE "knowledge_articles" CASCADE;
  DROP TABLE "_knowledge_articles_v_version_tags" CASCADE;
  DROP TABLE "_knowledge_articles_v" CASCADE;
  DROP TABLE "service_links" CASCADE;
  DROP TABLE "announcements" CASCADE;
  DROP TABLE "announcements_rels" CASCADE;
  DROP TABLE "_announcements_v" CASCADE;
  DROP TABLE "_announcements_v_rels" CASCADE;
  DROP TABLE "feishu_events" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TYPE "public"."enum_users_role";
  DROP TYPE "public"."enum_learning_paths_status";
  DROP TYPE "public"."enum__learning_paths_v_version_status";
  DROP TYPE "public"."enum_courses_status";
  DROP TYPE "public"."enum__courses_v_version_status";
  DROP TYPE "public"."enum_units_type";
  DROP TYPE "public"."enum_units_status";
  DROP TYPE "public"."enum__units_v_version_type";
  DROP TYPE "public"."enum__units_v_version_status";
  DROP TYPE "public"."enum_questions_type";
  DROP TYPE "public"."enum_questions_difficulty";
  DROP TYPE "public"."enum_questions_status";
  DROP TYPE "public"."enum__questions_v_version_type";
  DROP TYPE "public"."enum__questions_v_version_difficulty";
  DROP TYPE "public"."enum__questions_v_version_status";
  DROP TYPE "public"."enum_enrollments_status";
  DROP TYPE "public"."enum_unit_progress_status";
  DROP TYPE "public"."enum_knowledge_articles_type";
  DROP TYPE "public"."enum_knowledge_articles_status";
  DROP TYPE "public"."enum__knowledge_articles_v_version_type";
  DROP TYPE "public"."enum__knowledge_articles_v_version_status";
  DROP TYPE "public"."enum_announcements_audience";
  DROP TYPE "public"."enum_announcements_status";
  DROP TYPE "public"."enum__announcements_v_version_audience";
  DROP TYPE "public"."enum__announcements_v_version_status";`)
}
