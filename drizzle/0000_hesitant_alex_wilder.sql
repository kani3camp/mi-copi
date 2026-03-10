CREATE TYPE "public"."score_formula_version" AS ENUM('v1');--> statement-breakpoint
CREATE TYPE "public"."session_end_condition_type" AS ENUM('question_count', 'time_limit');--> statement-breakpoint
CREATE TYPE "public"."session_finish_reason" AS ENUM('target_reached', 'time_up', 'manual_end');--> statement-breakpoint
CREATE TYPE "public"."training_mode" AS ENUM('distance', 'keyboard');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"id_token" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "question_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"training_session_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"question_index" integer NOT NULL,
	"presented_at" timestamp with time zone NOT NULL,
	"answered_at" timestamp with time zone NOT NULL,
	"mode" "training_mode" NOT NULL,
	"base_note_name" text NOT NULL,
	"base_midi" integer NOT NULL,
	"target_note_name" text NOT NULL,
	"target_midi" integer NOT NULL,
	"answer_note_name" text NOT NULL,
	"answer_midi" integer NOT NULL,
	"target_interval_semitones" numeric(10, 3) NOT NULL,
	"answer_interval_semitones" numeric(10, 3) NOT NULL,
	"direction" text NOT NULL,
	"is_correct" boolean NOT NULL,
	"error_semitones" numeric(10, 3) NOT NULL,
	"response_time_ms" integer NOT NULL,
	"replay_base_count" integer NOT NULL,
	"replay_target_count" integer NOT NULL,
	"score" numeric(10, 3) NOT NULL,
	"score_formula_version" "score_formula_version" DEFAULT 'v1' NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "question_results_question_index_non_negative" CHECK ("question_results"."question_index" >= 0),
	CONSTRAINT "question_results_response_time_ms_non_negative" CHECK ("question_results"."response_time_ms" >= 0),
	CONSTRAINT "question_results_replay_base_count_non_negative" CHECK ("question_results"."replay_base_count" >= 0),
	CONSTRAINT "question_results_replay_target_count_non_negative" CHECK ("question_results"."replay_target_count" >= 0)
);
--> statement-breakpoint
CREATE TABLE "training_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"mode" "training_mode" NOT NULL,
	"score_formula_version" "score_formula_version" DEFAULT 'v1' NOT NULL,
	"finish_reason" "session_finish_reason" NOT NULL,
	"end_condition_type" "session_end_condition_type" NOT NULL,
	"config_snapshot" jsonb NOT NULL,
	"planned_question_count" integer,
	"planned_time_limit_seconds" integer,
	"answered_question_count" integer NOT NULL,
	"correct_question_count" integer NOT NULL,
	"session_score" numeric(10, 3) NOT NULL,
	"avg_score_per_question" numeric(10, 3) NOT NULL,
	"accuracy_rate" numeric(10, 3) NOT NULL,
	"avg_error_abs" numeric(10, 3) NOT NULL,
	"avg_response_time_ms" numeric(10, 3) NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "training_sessions_planned_question_count_non_negative" CHECK ("training_sessions"."planned_question_count" is null or "training_sessions"."planned_question_count" >= 0),
	CONSTRAINT "training_sessions_planned_time_limit_seconds_positive" CHECK ("training_sessions"."planned_time_limit_seconds" is null or "training_sessions"."planned_time_limit_seconds" > 0),
	CONSTRAINT "training_sessions_answered_question_count_non_negative" CHECK ("training_sessions"."answered_question_count" >= 0),
	CONSTRAINT "training_sessions_correct_question_count_non_negative" CHECK ("training_sessions"."correct_question_count" >= 0),
	CONSTRAINT "training_sessions_answered_question_count_lte_planned_question_count" CHECK ("training_sessions"."planned_question_count" is null or "training_sessions"."answered_question_count" <= "training_sessions"."planned_question_count"),
	CONSTRAINT "training_sessions_question_count_requires_planned_question_count" CHECK ("training_sessions"."end_condition_type" <> 'question_count' or "training_sessions"."planned_question_count" is not null),
	CONSTRAINT "training_sessions_time_limit_requires_planned_time_limit_seconds" CHECK ("training_sessions"."end_condition_type" <> 'time_limit' or "training_sessions"."planned_time_limit_seconds" is not null),
	CONSTRAINT "training_sessions_correct_question_count_lte_answered_question_count" CHECK ("training_sessions"."correct_question_count" <= "training_sessions"."answered_question_count"),
	CONSTRAINT "training_sessions_session_score_non_negative" CHECK ("training_sessions"."session_score" >= 0),
	CONSTRAINT "training_sessions_avg_score_per_question_non_negative" CHECK ("training_sessions"."avg_score_per_question" >= 0),
	CONSTRAINT "training_sessions_accuracy_rate_between_zero_and_one" CHECK ("training_sessions"."accuracy_rate" >= 0 and "training_sessions"."accuracy_rate" <= 1),
	CONSTRAINT "training_sessions_avg_error_abs_non_negative" CHECK ("training_sessions"."avg_error_abs" >= 0),
	CONSTRAINT "training_sessions_avg_response_time_ms_non_negative" CHECK ("training_sessions"."avg_response_time_ms" >= 0)
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"user_id" text PRIMARY KEY NOT NULL,
	"last_distance_config" jsonb NOT NULL,
	"last_keyboard_config" jsonb NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_results" ADD CONSTRAINT "question_results_training_session_id_training_sessions_id_fk" FOREIGN KEY ("training_session_id") REFERENCES "public"."training_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_results" ADD CONSTRAINT "question_results_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_sessions" ADD CONSTRAINT "training_sessions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "question_results_training_session_id_idx" ON "question_results" USING btree ("training_session_id");--> statement-breakpoint
CREATE INDEX "question_results_user_id_mode_answered_at_idx" ON "question_results" USING btree ("user_id","mode","answered_at");--> statement-breakpoint
CREATE INDEX "question_results_training_session_id_question_index_idx" ON "question_results" USING btree ("training_session_id","question_index");--> statement-breakpoint
CREATE UNIQUE INDEX "question_results_training_session_id_question_index_key" ON "question_results" USING btree ("training_session_id","question_index");--> statement-breakpoint
CREATE INDEX "training_sessions_user_id_idx" ON "training_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "training_sessions_user_id_mode_ended_at_idx" ON "training_sessions" USING btree ("user_id","mode","ended_at");--> statement-breakpoint
CREATE INDEX "training_sessions_user_id_ended_at_idx" ON "training_sessions" USING btree ("user_id","ended_at");