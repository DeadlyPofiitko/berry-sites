using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class UseOrderAsKey : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_ImagePatterns",
                table: "ImagePatterns");

            migrationBuilder.AddPrimaryKey(
                name: "PK_ImagePatterns",
                table: "ImagePatterns",
                columns: new[] { "ImageId", "PatternId", "Order" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_ImagePatterns",
                table: "ImagePatterns");

            migrationBuilder.AddPrimaryKey(
                name: "PK_ImagePatterns",
                table: "ImagePatterns",
                columns: new[] { "ImageId", "PatternId" });
        }
    }
}
