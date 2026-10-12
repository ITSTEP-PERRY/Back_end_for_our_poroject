using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Perry.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddSellerIdAndOrderNumber : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "SellerId",
                table: "Products",
                type: "uuid",
                nullable: true);

            // Nullable first — existing rows need unique values before UNIQUE + NOT NULL
            migrationBuilder.AddColumn<string>(
                name: "OrderNumber",
                table: "Orders",
                type: "character varying(16)",
                maxLength: 16,
                nullable: true);

            // Backfill unique short codes (# + 2 letters + 3 digits + 2 letters)
            migrationBuilder.Sql(
                """
                UPDATE "Orders"
                SET "OrderNumber" = '#' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 2))
                    || lpad((floor(random() * 1000))::int::text, 3, '0')
                    || upper(substr(replace(gen_random_uuid()::text, '-', ''), 3, 2))
                WHERE "OrderNumber" IS NULL OR "OrderNumber" = '';
                """);

            migrationBuilder.AlterColumn<string>(
                name: "OrderNumber",
                table: "Orders",
                type: "character varying(16)",
                maxLength: 16,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_Products_SellerId",
                table: "Products",
                column: "SellerId");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_OrderNumber",
                table: "Orders",
                column: "OrderNumber",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Products_SellerId",
                table: "Products");

            migrationBuilder.DropIndex(
                name: "IX_Orders_OrderNumber",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "SellerId",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "OrderNumber",
                table: "Orders");
        }
    }
}
