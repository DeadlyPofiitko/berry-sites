using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class addImagePatternId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_ImagePatterns",
                table: "ImagePatterns");

            migrationBuilder.AddColumn<Guid>(
                name: "Id",
                table: "ImagePatterns",
                type: "TEXT",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddPrimaryKey(
                name: "PK_ImagePatterns",
                table: "ImagePatterns",
                column: "Id");

            migrationBuilder.CreateIndex(
                name: "IX_ImagePatterns_ImageId",
                table: "ImagePatterns",
                column: "ImageId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_ImagePatterns",
                table: "ImagePatterns");

            migrationBuilder.DropIndex(
                name: "IX_ImagePatterns_ImageId",
                table: "ImagePatterns");

            migrationBuilder.DropColumn(
                name: "Id",
                table: "ImagePatterns");

            migrationBuilder.AddPrimaryKey(
                name: "PK_ImagePatterns",
                table: "ImagePatterns",
                columns: new[] { "ImageId", "PatternId", "Order" });
        }
    }
}
