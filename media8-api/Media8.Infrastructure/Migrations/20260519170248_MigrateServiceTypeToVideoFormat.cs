using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Media8.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class MigrateServiceTypeToVideoFormat : Migration
    {
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // Truncate transactional tables to avoid NOT NULL constraint violations
        // Preserves Users, Profiles, UserRoles (core data)
        migrationBuilder.Sql(@"
            TRUNCATE TABLE ""OrderTimelines"", ""Orders"", ""ServiceBalanceLots"", ""PackageAssignments"", ""Packages"" CASCADE;
        ");

        migrationBuilder.DropColumn(
            name: "ServiceType",
            table: "ServiceBalanceLots");

            migrationBuilder.DropColumn(
                name: "ServiceTypes",
                table: "Packages");

            migrationBuilder.DropColumn(
                name: "ServiceType",
                table: "Orders");

            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:Enum:app_role", "client,editor,admin")
                .Annotation("Npgsql:Enum:assignment_status", "active,expired,cancelled")
                .Annotation("Npgsql:Enum:complexity_level", "standard,premium,god_mode")
                .Annotation("Npgsql:Enum:lot_source", "purchase,subscription,promo,gift")
                .Annotation("Npgsql:Enum:notification_type", "info,success,warning,order")
                .Annotation("Npgsql:Enum:order_status", "pending,in_progress,in_review,changes_requested,approved")
                .Annotation("Npgsql:Enum:package_category", "assinatura,pacote,avulso")
                .Annotation("Npgsql:Enum:timeline_action_type", "status_change,comment,version_upload")
                .OldAnnotation("Npgsql:Enum:app_role", "client,editor,admin")
                .OldAnnotation("Npgsql:Enum:assignment_status", "active,expired,cancelled")
                .OldAnnotation("Npgsql:Enum:lot_source", "purchase,subscription,promo,gift")
                .OldAnnotation("Npgsql:Enum:notification_type", "info,success,warning,order")
                .OldAnnotation("Npgsql:Enum:order_status", "pending,in_progress,in_review,changes_requested,approved")
                .OldAnnotation("Npgsql:Enum:package_category", "assinatura,pacote,avulso")
                .OldAnnotation("Npgsql:Enum:service_type", "reels_standard,reels_premium,youtube_curto,youtube_medio,youtube_longo,pacote_reels,avulso")
                .OldAnnotation("Npgsql:Enum:timeline_action_type", "status_change,comment,version_upload");

            migrationBuilder.AddColumn<Guid>(
                name: "VideoFormatId",
                table: "ServiceBalanceLots",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "VideoFormatId",
                table: "Orders",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateTable(
                name: "video_formats",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Slug = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    MaxDurationSeconds = table.Column<int>(type: "integer", nullable: false),
                    Tier = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_video_formats", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "package_video_formats",
                columns: table => new
                {
                    PackagesId = table.Column<Guid>(type: "uuid", nullable: false),
                    SupportedFormatsId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_package_video_formats", x => new { x.PackagesId, x.SupportedFormatsId });
                    table.ForeignKey(
                        name: "FK_package_video_formats_Packages_PackagesId",
                        column: x => x.PackagesId,
                        principalTable: "Packages",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_package_video_formats_video_formats_SupportedFormatsId",
                        column: x => x.SupportedFormatsId,
                        principalTable: "video_formats",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ServiceBalanceLots_VideoFormatId",
                table: "ServiceBalanceLots",
                column: "VideoFormatId");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_VideoFormatId",
                table: "Orders",
                column: "VideoFormatId");

            migrationBuilder.CreateIndex(
                name: "IX_package_video_formats_SupportedFormatsId",
                table: "package_video_formats",
                column: "SupportedFormatsId");

            migrationBuilder.CreateIndex(
                name: "IX_video_formats_Slug",
                table: "video_formats",
                column: "Slug",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Orders_video_formats_VideoFormatId",
                table: "Orders",
                column: "VideoFormatId",
                principalTable: "video_formats",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ServiceBalanceLots_video_formats_VideoFormatId",
                table: "ServiceBalanceLots",
                column: "VideoFormatId",
                principalTable: "video_formats",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Orders_video_formats_VideoFormatId",
                table: "Orders");

            migrationBuilder.DropForeignKey(
                name: "FK_ServiceBalanceLots_video_formats_VideoFormatId",
                table: "ServiceBalanceLots");

            migrationBuilder.DropTable(
                name: "package_video_formats");

            migrationBuilder.DropTable(
                name: "video_formats");

            migrationBuilder.DropIndex(
                name: "IX_ServiceBalanceLots_VideoFormatId",
                table: "ServiceBalanceLots");

            migrationBuilder.DropIndex(
                name: "IX_Orders_VideoFormatId",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "VideoFormatId",
                table: "ServiceBalanceLots");

            migrationBuilder.DropColumn(
                name: "VideoFormatId",
                table: "Orders");

            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:Enum:app_role", "client,editor,admin")
                .Annotation("Npgsql:Enum:assignment_status", "active,expired,cancelled")
                .Annotation("Npgsql:Enum:lot_source", "purchase,subscription,promo,gift")
                .Annotation("Npgsql:Enum:notification_type", "info,success,warning,order")
                .Annotation("Npgsql:Enum:order_status", "pending,in_progress,in_review,changes_requested,approved")
                .Annotation("Npgsql:Enum:package_category", "assinatura,pacote,avulso")
                .Annotation("Npgsql:Enum:service_type", "reels_standard,reels_premium,youtube_curto,youtube_medio,youtube_longo,pacote_reels,avulso")
                .Annotation("Npgsql:Enum:timeline_action_type", "status_change,comment,version_upload")
                .OldAnnotation("Npgsql:Enum:app_role", "client,editor,admin")
                .OldAnnotation("Npgsql:Enum:assignment_status", "active,expired,cancelled")
                .OldAnnotation("Npgsql:Enum:complexity_level", "standard,premium,god_mode")
                .OldAnnotation("Npgsql:Enum:lot_source", "purchase,subscription,promo,gift")
                .OldAnnotation("Npgsql:Enum:notification_type", "info,success,warning,order")
                .OldAnnotation("Npgsql:Enum:order_status", "pending,in_progress,in_review,changes_requested,approved")
                .OldAnnotation("Npgsql:Enum:package_category", "assinatura,pacote,avulso")
                .OldAnnotation("Npgsql:Enum:timeline_action_type", "status_change,comment,version_upload");

            migrationBuilder.AddColumn<int>(
                name: "ServiceType",
                table: "ServiceBalanceLots",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int[]>(
                name: "ServiceTypes",
                table: "Packages",
                type: "integer[]",
                nullable: false,
                defaultValue: new int[0]);

            migrationBuilder.AddColumn<int>(
                name: "ServiceType",
                table: "Orders",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }
    }
}
