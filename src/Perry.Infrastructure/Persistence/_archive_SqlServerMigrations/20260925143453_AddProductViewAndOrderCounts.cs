using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Perry.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddProductViewAndOrderCounts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "OrderCount",
                table: "Products",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "ViewCount",
                table: "Products",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_Products_OrderCount",
                table: "Products",
                column: "OrderCount");

            migrationBuilder.CreateIndex(
                name: "IX_Products_ViewCount",
                table: "Products",
                column: "ViewCount");

            // Backfill sold units from existing order lines.
            migrationBuilder.Sql("""
                UPDATE p
                SET OrderCount = ISNULL(x.Qty, 0)
                FROM Products p
                LEFT JOIN (
                    SELECT ProductId, SUM(Quantity) AS Qty
                    FROM OrderItems
                    GROUP BY ProductId
                ) x ON x.ProductId = p.Id
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Products_OrderCount",
                table: "Products");

            migrationBuilder.DropIndex(
                name: "IX_Products_ViewCount",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "OrderCount",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "ViewCount",
                table: "Products");
        }
    }
}
