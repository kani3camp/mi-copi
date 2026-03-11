ALTER TABLE "question_results" DROP CONSTRAINT "question_results_training_session_id_training_sessions_id_fk";
--> statement-breakpoint
ALTER TABLE "question_results" DROP CONSTRAINT "question_results_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "training_sessions" DROP CONSTRAINT "training_sessions_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "user_settings" DROP CONSTRAINT "user_settings_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "question_results" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "training_sessions" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "user_settings" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "user_settings" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "question_results" ADD CONSTRAINT "question_results_training_session_id_training_sessions_id_fk" FOREIGN KEY ("training_session_id") REFERENCES "public"."training_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_results" ADD CONSTRAINT "question_results_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_sessions" ADD CONSTRAINT "training_sessions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;