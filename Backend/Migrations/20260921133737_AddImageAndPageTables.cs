using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddImageAndPageTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Pages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Pages", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PageContents",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Title = table.Column<string>(type: "TEXT", nullable: false),
                    Subtitle = table.Column<string>(type: "TEXT", nullable: false),
                    Language = table.Column<int>(type: "INTEGER", nullable: false),
                    PageId = table.Column<Guid>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PageContents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PageContents_Pages_PageId",
                        column: x => x.PageId,
                        principalTable: "Pages",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Patterns",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Order = table.Column<int>(type: "INTEGER", nullable: false),
                    PageId = table.Column<Guid>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Patterns", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Patterns_Pages_PageId",
                        column: x => x.PageId,
                        principalTable: "Pages",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ImagePatterns",
                columns: table => new
                {
                    ImageId = table.Column<Guid>(type: "TEXT", nullable: false),
                    PatternId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Order = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ImagePatterns", x => new { x.ImageId, x.PatternId });
                    table.ForeignKey(
                        name: "FK_ImagePatterns_Images_ImageId",
                        column: x => x.ImageId,
                        principalTable: "Images",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ImagePatterns_Patterns_PatternId",
                        column: x => x.PatternId,
                        principalTable: "Patterns",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ImagePatterns_Order_PatternId",
                table: "ImagePatterns",
                columns: new[] { "Order", "PatternId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ImagePatterns_PatternId",
                table: "ImagePatterns",
                column: "PatternId");

            migrationBuilder.CreateIndex(
                name: "IX_PageContents_PageId_Language",
                table: "PageContents",
                columns: new[] { "PageId", "Language" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PageContents_Title_Language",
                table: "PageContents",
                columns: new[] { "Title", "Language" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Patterns_PageId",
                table: "Patterns",
                column: "PageId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ImagePatterns");

            migrationBuilder.DropTable(
                name: "PageContents");

            migrationBuilder.DropTable(
                name: "Patterns");

            migrationBuilder.DropTable(
                name: "Pages");
        }
    }
}
