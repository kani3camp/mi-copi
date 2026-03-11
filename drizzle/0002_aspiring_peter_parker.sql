ALTER TABLE "user_settings" ADD COLUMN "master_volume" integer DEFAULT 80 NOT NULL;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "sound_effects_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "interval_notation_style" text DEFAULT 'ja' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "keyboard_note_labels_visible" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "user_settings" ALTER COLUMN "master_volume" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "user_settings" ALTER COLUMN "sound_effects_enabled" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "user_settings" ALTER COLUMN "interval_notation_style" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "user_settings" ALTER COLUMN "keyboard_note_labels_visible" DROP DEFAULT;
