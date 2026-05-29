using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Media8.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddInvoicesTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:Enum:app_role", "client,editor,admin")
                .Annotation("Npgsql:Enum:assignment_status", "active,expired,cancelled")
                .Annotation("Npgsql:Enum:contract_type", "avulso,pacote,assinatura")
                .Annotation("Npgsql:Enum:invoice_status", "pending,paid,overdue,cancelled")
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
                .OldAnnotation("Npgsql:Enum:order_status", "draft,pending,processing,in_progress,in_review,changes_requested,approved,completed,cancelled")
                .OldAnnotation("Npgsql:Enum:package_category", "assinatura,pacote,avulso")
                .OldAnnotation("Npgsql:Enum:timeline_action_type", "status_change,comment,version_upload");

            migrationBuilder.CreateTable(
                name: "Invoices",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ClientId = table.Column<Guid>(type: "uuid", nullable: false),
                    ContractId = table.Column<Guid>(type: "uuid", nullable: true),
                    Description = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    Amount = table.Column<decimal>(type: "numeric", nullable: false),
                    CycleNumber = table.Column<int>(type: "integer", nullable: true),
                    DueDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    PaidAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    PaymentMethod = table.Column<string>(type: "text", nullable: true),
                    GatewayInvoiceId = table.Column<string>(type: "text", nullable: true),
                    TransactionId = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Invoices", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Invoices_ClientContracts_ContractId",
                        column: x => x.ContractId,
                        principalTable: "ClientContracts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Invoices_Users_ClientId",
                        column: x => x.ClientId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Invoices_ClientId",
                table: "Invoices",
                column: "ClientId");

            migrationBuilder.CreateIndex(
                name: "IX_Invoices_ContractId",
                table: "Invoices",
                column: "ContractId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Invoices");

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
                .OldAnnotation("Npgsql:Enum:invoice_status", "pending,paid,overdue,cancelled")
                .OldAnnotation("Npgsql:Enum:lot_source", "purchase,subscription,promo,gift")
                .OldAnnotation("Npgsql:Enum:notification_type", "info,success,warning,order")
                .OldAnnotation("Npgsql:Enum:order_status", "draft,pending,processing,in_progress,in_review,changes_requested,approved,completed,cancelled")
                .OldAnnotation("Npgsql:Enum:package_category", "assinatura,pacote,avulso")
                .OldAnnotation("Npgsql:Enum:timeline_action_type", "status_change,comment,version_upload");
        }
    }
}
