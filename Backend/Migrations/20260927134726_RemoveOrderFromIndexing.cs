using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class RemoveOrderFromIndexing : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ImagePatterns_Order_PatternId",
                table: "ImagePatterns");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_ImagePatterns_Order_PatternId",
                table: "ImagePatterns",
                columns: new[] { "Order", "PatternId" },
                unique: true);
        }
    }
}
