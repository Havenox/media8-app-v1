using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Media8.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RefactorToContractSnapshotPattern : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ServiceBalanceLots_ClientContracts_AssignmentId",
                table: "ServiceBalanceLots");

            migrationBuilder.DropForeignKey(
                name: "FK_ServiceBalanceLots_Users_UserId",
                table: "ServiceBalanceLots");

            migrationBuilder.DropForeignKey(
                name: "FK_ServiceBalanceLots_VideoFormats_VideoFormatId",
                table: "ServiceBalanceLots");

            migrationBuilder.DropIndex(
                name: "IX_ServiceBalanceLots_AssignmentId",
                table: "ServiceBalanceLots");

            migrationBuilder.DropIndex(
                name: "IX_ServiceBalanceLots_VideoFormatId",
                table: "ServiceBalanceLots");

            migrationBuilder.DropColumn(
                name: "PurchasedAt",
                table: "ServiceBalanceLots");

// Renomeia VideoFormatId para ContractId temporariamente (será convertido para Guid correto)
migrationBuilder.RenameColumn(
name: "VideoFormatId",
table: "ServiceBalanceLots",
newName: "ContractId");

// Deleta TODOS dados legados em cascata para criar FK ContractId sem violações
migrationBuilder.Sql(@"DELETE FROM ""Orders""");
migrationBuilder.Sql(@"DELETE FROM ""ServiceBalanceLots""");
migrationBuilder.Sql(@"DELETE FROM ""ClientContracts""");

migrationBuilder.AlterColumn<int>(
                name: "SnapshotVideoQuantity",
                table: "ClientContracts",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "SnapshotPrice",
                table: "ClientContracts",
                type: "numeric",
                nullable: false,
                defaultValue: 0m,
                oldClrType: typeof(decimal),
                oldType: "numeric",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "SnapshotOfferName",
                table: "ClientContracts",
                type: "character varying(255)",
                maxLength: 255,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "character varying(255)",
                oldMaxLength: 255,
                oldNullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SnapshotDeliveryDays",
                table: "ClientContracts",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SnapshotEditingStyleName",
                table: "ClientContracts",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "SnapshotMaxDurationSeconds",
                table: "ClientContracts",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "SnapshotVideoFormatName",
                table: "ClientContracts",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "SnapshotWarrantyDays",
                table: "ClientContracts",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ServiceBalanceLots_ContractId_UserId_CreatedAt",
                table: "ServiceBalanceLots",
                columns: new[] { "ContractId", "UserId", "CreatedAt" });

            migrationBuilder.AddForeignKey(
                name: "FK_ServiceBalanceLots_ClientContracts_ContractId",
                table: "ServiceBalanceLots",
                column: "ContractId",
                principalTable: "ClientContracts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_ServiceBalanceLots_Users_UserId",
                table: "ServiceBalanceLots",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ServiceBalanceLots_ClientContracts_ContractId",
                table: "ServiceBalanceLots");

            migrationBuilder.DropForeignKey(
                name: "FK_ServiceBalanceLots_Users_UserId",
                table: "ServiceBalanceLots");

            migrationBuilder.DropIndex(
                name: "IX_ServiceBalanceLots_ContractId_UserId_CreatedAt",
                table: "ServiceBalanceLots");

            migrationBuilder.DropColumn(
                name: "SnapshotDeliveryDays",
                table: "ClientContracts");

            migrationBuilder.DropColumn(
                name: "SnapshotEditingStyleName",
                table: "ClientContracts");

            migrationBuilder.DropColumn(
                name: "SnapshotMaxDurationSeconds",
                table: "ClientContracts");

            migrationBuilder.DropColumn(
                name: "SnapshotVideoFormatName",
                table: "ClientContracts");

            migrationBuilder.DropColumn(
                name: "SnapshotWarrantyDays",
                table: "ClientContracts");

            migrationBuilder.RenameColumn(
                name: "ContractId",
                table: "ServiceBalanceLots",
                newName: "VideoFormatId");

            migrationBuilder.AddColumn<DateTime>(
                name: "PurchasedAt",
                table: "ServiceBalanceLots",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AlterColumn<int>(
                name: "SnapshotVideoQuantity",
                table: "ClientContracts",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AlterColumn<decimal>(
                name: "SnapshotPrice",
                table: "ClientContracts",
                type: "numeric",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric");

            migrationBuilder.AlterColumn<string>(
                name: "SnapshotOfferName",
                table: "ClientContracts",
                type: "character varying(255)",
                maxLength: 255,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(255)",
                oldMaxLength: 255);

            migrationBuilder.CreateIndex(
                name: "IX_ServiceBalanceLots_AssignmentId",
                table: "ServiceBalanceLots",
                column: "AssignmentId");

            migrationBuilder.CreateIndex(
                name: "IX_ServiceBalanceLots_VideoFormatId",
                table: "ServiceBalanceLots",
                column: "VideoFormatId");

            migrationBuilder.AddForeignKey(
                name: "FK_ServiceBalanceLots_ClientContracts_AssignmentId",
                table: "ServiceBalanceLots",
                column: "AssignmentId",
                principalTable: "ClientContracts",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_ServiceBalanceLots_Users_UserId",
                table: "ServiceBalanceLots",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ServiceBalanceLots_VideoFormats_VideoFormatId",
                table: "ServiceBalanceLots",
                column: "VideoFormatId",
                principalTable: "VideoFormats",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
