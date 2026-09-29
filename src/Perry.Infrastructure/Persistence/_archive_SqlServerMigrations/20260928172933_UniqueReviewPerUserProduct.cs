using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Perry.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class UniqueReviewPerUserProduct : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Seed/legacy rows often share Guid.Empty UserId — assign unique ids first.
            migrationBuilder.Sql("""
                UPDATE pr
                SET UserId = NEWID()
                FROM ProductReviews AS pr
                WHERE pr.UserId = '00000000-0000-0000-0000-000000000000';
                """);

            // Keep newest review per (UserId, ProductId); drop older duplicates.
            migrationBuilder.Sql("""
                SELECT Id
                INTO #dup
                FROM (
                    SELECT Id,
                           ROW_NUMBER() OVER (
                               PARTITION BY UserId, ProductId
                               ORDER BY CreatedAtUtc DESC, Id DESC) AS rn
                    FROM ProductReviews
                ) AS ranked
                WHERE rn > 1;

                DELETE FROM ProductReviewGrades WHERE ReviewId IN (SELECT Id FROM #dup);
                DELETE FROM ProductReviewTags WHERE ReviewId IN (SELECT Id FROM #dup);
                DELETE FROM ProductReviewImages WHERE ReviewId IN (SELECT Id FROM #dup);
                DELETE FROM ProductReviews WHERE Id IN (SELECT Id FROM #dup);
                DROP TABLE #dup;
                """);

            migrationBuilder.CreateIndex(
                name: "IX_ProductReviews_UserId",
                table: "ProductReviews",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductReviews_UserId_ProductId",
                table: "ProductReviews",
                columns: new[] { "UserId", "ProductId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ProductReviews_UserId",
                table: "ProductReviews");

            migrationBuilder.DropIndex(
                name: "IX_ProductReviews_UserId_ProductId",
                table: "ProductReviews");
        }
    }
}
