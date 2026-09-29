using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Perry.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddProductSlug : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                IF COL_LENGTH('dbo.Products', 'Slug') IS NULL
                    ALTER TABLE [Products] ADD [Slug] nvarchar(220) NOT NULL
                        CONSTRAINT [DF_Products_Slug] DEFAULT N'';
                """);

            migrationBuilder.Sql("""
                UPDATE [Products]
                SET [Slug] = LOWER([Sku]) + N'-' + LEFT(REPLACE(CONVERT(nvarchar(36), [Id]), N'-', N''), 8)
                WHERE [Slug] IS NULL OR [Slug] = N'';
                """);

            migrationBuilder.Sql("""
                IF NOT EXISTS (
                    SELECT 1 FROM sys.indexes
                    WHERE name = N'IX_Products_Slug' AND object_id = OBJECT_ID(N'dbo.Products'))
                    CREATE UNIQUE INDEX [IX_Products_Slug] ON [Products] ([Slug]);
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                IF EXISTS (
                    SELECT 1 FROM sys.indexes
                    WHERE name = N'IX_Products_Slug' AND object_id = OBJECT_ID(N'dbo.Products'))
                    DROP INDEX [IX_Products_Slug] ON [Products];
                """);

            migrationBuilder.Sql("""
                IF OBJECT_ID(N'dbo.DF_Products_Slug', N'D') IS NOT NULL
                    ALTER TABLE [Products] DROP CONSTRAINT [DF_Products_Slug];
                """);

            migrationBuilder.Sql("""
                IF COL_LENGTH('dbo.Products', 'Slug') IS NOT NULL
                    ALTER TABLE [Products] DROP COLUMN [Slug];
                """);
        }
    }
}
