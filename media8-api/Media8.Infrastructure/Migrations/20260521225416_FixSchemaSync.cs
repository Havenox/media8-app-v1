using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Media8.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FixSchemaSync : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:Enum:app_role", "client,editor,admin")
                .Annotation("Npgsql:Enum:assignment_status", "active,expired,cancelled")
                .Annotation("Npgsql:Enum:contract_type", "avulso,pacote,assinatura")
                .Annotation("Npgsql:Enum:lot_source", "purchase,subscription,promo,gift")
                .Annotation("Npgsql:Enum:notification_type", "info,success,warning,order")
                .Annotation("Npgsql:Enum:order_status", "draft,pending,processing,in_progress,in_review,changes_requested,approved,completed,cancelled")
                .Annotation("Npgsql:Enum:package_category", "assinatura,pacote,avulso")
                .Annotation("Npgsql:Enum:timeline_action_type", "status_change,comment,version_upload")
                .OldAnnotation("Npgsql:Enum:app_role", "client,editor,admin")
                .OldAnnotation("Npgsql:Enum:assignment_status", "active,expired,cancelled")
                .OldAnnotation("Npgsql:Enum:contract_type", "avulso,pacote,assinatura")
                .OldAnnotation("Npgsql:Enum:lot_source", "purchase,subscription,promo,gift")
                .OldAnnotation("Npgsql:Enum:notification_type", "info,success,warning,order")
                .OldAnnotation("Npgsql:Enum:order_status", "pending,in_progress,in_review,changes_requested,approved")
                .OldAnnotation("Npgsql:Enum:package_category", "assinatura,pacote,avulso")
                .OldAnnotation("Npgsql:Enum:timeline_action_type", "status_change,comment,version_upload");

            migrationBuilder.AddColumn<Guid>(
                name: "AssignmentId",
                table: "Orders",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ContractId",
                table: "Orders",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ServiceBalanceLotId",
                table: "Orders",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Orders_ContractId",
                table: "Orders",
                column: "ContractId");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_ServiceBalanceLotId",
                table: "Orders",
                column: "ServiceBalanceLotId");

            migrationBuilder.AddForeignKey(
                name: "FK_Orders_ClientContracts_ContractId",
                table: "Orders",
                column: "ContractId",
                principalTable: "ClientContracts",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Orders_ServiceBalanceLots_ServiceBalanceLotId",
                table: "Orders",
                column: "ServiceBalanceLotId",
                principalTable: "ServiceBalanceLots",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Orders_ClientContracts_ContractId",
                table: "Orders");

            migrationBuilder.DropForeignKey(
                name: "FK_Orders_ServiceBalanceLots_ServiceBalanceLotId",
                table: "Orders");

            migrationBuilder.DropIndex(
                name: "IX_Orders_ContractId",
                table: "Orders");

            migrationBuilder.DropIndex(
                name: "IX_Orders_ServiceBalanceLotId",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "AssignmentId",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "ContractId",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "ServiceBalanceLotId",
                table: "Orders");

            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:Enum:app_role", "client,editor,admin")
                .Annotation("Npgsql:Enum:assignment_status", "active,expired,cancelled")
                .Annotation("Npgsql:Enum:contract_type", "avulso,pacote,assinatura")
                .Annotation("Npgsql:Enum:lot_source", "purchase,subscription,promo,gift")
                .Annotation("Npgsql:Enum:notification_type", "info,success,warning,order")
                .Annotation("Npgsql:Enum:order_status", "pending,in_progress,in_review,changes_requested,approved")
                .Annotation("Npgsql:Enum:package_category", "assinatura,pacote,avulso")
                .Annotation("Npgsql:Enum:timeline_action_type", "status_change,comment,version_upload")
                .OldAnnotation("Npgsql:Enum:app_role", "client,editor,admin")
                .OldAnnotation("Npgsql:Enum:assignment_status", "active,expired,cancelled")
                .OldAnnotation("Npgsql:Enum:contract_type", "avulso,pacote,assinatura")
                .OldAnnotation("Npgsql:Enum:lot_source", "purchase,subscription,promo,gift")
                .OldAnnotation("Npgsql:Enum:notification_type", "info,success,warning,order")
                .OldAnnotation("Npgsql:Enum:order_status", "draft,pending,processing,in_progress,in_review,changes_requested,approved,completed,cancelled")
                .OldAnnotation("Npgsql:Enum:package_category", "assinatura,pacote,avulso")
                .OldAnnotation("Npgsql:Enum:timeline_action_type", "status_change,comment,version_upload");
        }
    }
}
