using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Media8.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddEditingStyleAndRemoveTier : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Tier",
                table: "video_formats");

            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:Enum:app_role", "client,editor,admin")
                .Annotation("Npgsql:Enum:assignment_status", "active,expired,cancelled")
                .Annotation("Npgsql:Enum:lot_source", "purchase,subscription,promo,gift")
                .Annotation("Npgsql:Enum:notification_type", "info,success,warning,order")
                .Annotation("Npgsql:Enum:order_status", "pending,in_progress,in_review,changes_requested,approved")
                .Annotation("Npgsql:Enum:package_category", "assinatura,pacote,avulso")
                .Annotation("Npgsql:Enum:timeline_action_type", "status_change,comment,version_upload")
                .OldAnnotation("Npgsql:Enum:app_role", "client,editor,admin")
                .OldAnnotation("Npgsql:Enum:assignment_status", "active,expired,cancelled")
                .OldAnnotation("Npgsql:Enum:complexity_level", "standard,premium,god_mode")
                .OldAnnotation("Npgsql:Enum:lot_source", "purchase,subscription,promo,gift")
                .OldAnnotation("Npgsql:Enum:notification_type", "info,success,warning,order")
                .OldAnnotation("Npgsql:Enum:order_status", "pending,in_progress,in_review,changes_requested,approved")
                .OldAnnotation("Npgsql:Enum:package_category", "assinatura,pacote,avulso")
                .OldAnnotation("Npgsql:Enum:timeline_action_type", "status_change,comment,version_upload");

            migrationBuilder.AddColumn<Guid>(
                name: "EditingStyleId",
                table: "video_formats",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "editing_styles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_editing_styles", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_video_formats_EditingStyleId",
                table: "video_formats",
                column: "EditingStyleId");

            migrationBuilder.AddForeignKey(
                name: "FK_video_formats_editing_styles_EditingStyleId",
                table: "video_formats",
                column: "EditingStyleId",
                principalTable: "editing_styles",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_video_formats_editing_styles_EditingStyleId",
                table: "video_formats");

            migrationBuilder.DropTable(
                name: "editing_styles");

            migrationBuilder.DropIndex(
                name: "IX_video_formats_EditingStyleId",
                table: "video_formats");

            migrationBuilder.DropColumn(
                name: "EditingStyleId",
                table: "video_formats");

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
                .OldAnnotation("Npgsql:Enum:timeline_action_type", "status_change,comment,version_upload");

            migrationBuilder.AddColumn<int>(
                name: "Tier",
                table: "video_formats",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }
    }
}
