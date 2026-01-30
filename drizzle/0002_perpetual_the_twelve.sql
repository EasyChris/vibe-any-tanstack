CREATE TYPE "public"."order_status" AS ENUM('pending', 'paid', 'canceled', 'expired', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."order_type" AS ENUM('subscription', 'credit_package');--> statement-breakpoint
CREATE TABLE "order" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"order_type" "order_type" NOT NULL,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"product_id" text,
	"product_name" text,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"expire_at" timestamp,
	"paid_at" timestamp,
	"metadata" jsonb,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "credits" DROP CONSTRAINT "credits_transaction_id_unique";--> statement-breakpoint
ALTER TABLE "payment" ADD COLUMN "order_id" text;--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "order_user_id_idx" ON "order" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "order_status_idx" ON "order" USING btree ("status");--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_order_id_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."order"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "payment_order_id_idx" ON "payment" USING btree ("order_id");--> statement-breakpoint
ALTER TABLE "credits" DROP COLUMN "transaction_id";