using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Perry.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class UpdateTablePreviewGrades : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "ReviewId",
                table: "ProductReviewGrades",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateIndex(
                name: "IX_ProductReviewGrades_ReviewId",
                table: "ProductReviewGrades",
                column: "ReviewId");

            migrationBuilder.AddForeignKey(
                name: "FK_ProductReviewGrades_ProductReviews_ReviewId",
                table: "ProductReviewGrades",
                column: "ReviewId",
                principalTable: "ProductReviews",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ProductReviewGrades_ProductReviews_ReviewId",
                table: "ProductReviewGrades");

            migrationBuilder.DropIndex(
                name: "IX_ProductReviewGrades_ReviewId",
                table: "ProductReviewGrades");

            migrationBuilder.DropColumn(
                name: "ReviewId",
                table: "ProductReviewGrades");
        }
    }
}
