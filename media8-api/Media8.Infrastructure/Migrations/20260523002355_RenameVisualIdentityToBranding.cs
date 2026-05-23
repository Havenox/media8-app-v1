using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Media8.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RenameVisualIdentityToBranding : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "VisualIdentityProfiles");

            migrationBuilder.CreateTable(
                name: "BrandingProfiles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    SocialHandles = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    BrandColors = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    BrandFonts = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    TargetAudience = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    BrandAssetsUrl = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BrandingProfiles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BrandingProfiles_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BrandingProfiles_UserId",
                table: "BrandingProfiles",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BrandingProfiles");

            migrationBuilder.CreateTable(
                name: "VisualIdentityProfiles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BrandAssetsUrl = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    BrandColors = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    BrandFonts = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    SocialHandles = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    TargetAudience = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VisualIdentityProfiles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VisualIdentityProfiles_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_VisualIdentityProfiles_UserId",
                table: "VisualIdentityProfiles",
                column: "UserId");
        }
    }
}
