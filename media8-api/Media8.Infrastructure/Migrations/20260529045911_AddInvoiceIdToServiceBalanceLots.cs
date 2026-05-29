using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Media8.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddInvoiceIdToServiceBalanceLots : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "InvoiceId",
                table: "ServiceBalanceLots",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ServiceBalanceLots_InvoiceId",
                table: "ServiceBalanceLots",
                column: "InvoiceId");

            migrationBuilder.AddForeignKey(
                name: "FK_ServiceBalanceLots_Invoices_InvoiceId",
                table: "ServiceBalanceLots",
                column: "InvoiceId",
                principalTable: "Invoices",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ServiceBalanceLots_Invoices_InvoiceId",
                table: "ServiceBalanceLots");

            migrationBuilder.DropIndex(
                name: "IX_ServiceBalanceLots_InvoiceId",
                table: "ServiceBalanceLots");

            migrationBuilder.DropColumn(
                name: "InvoiceId",
                table: "ServiceBalanceLots");
        }
    }
}
