using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Media8.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSequentialIdToEntities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Orders_ClientId",
                table: "Orders");

            migrationBuilder.DropIndex(
                name: "IX_Invoices_ClientId",
                table: "Invoices");

            migrationBuilder.DropIndex(
                name: "IX_EditingProfiles_UserId",
                table: "EditingProfiles");

            migrationBuilder.DropIndex(
                name: "IX_ClientContracts_ClientId",
                table: "ClientContracts");

            migrationBuilder.DropIndex(
                name: "IX_BrandingProfiles_UserId",
                table: "BrandingProfiles");

            migrationBuilder.AddColumn<int>(
                name: "SequentialId",
                table: "Orders",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "SequentialId",
                table: "Invoices",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "SequentialId",
                table: "EditingProfiles",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "SequentialId",
                table: "ClientContracts",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "SequentialId",
                table: "BrandingProfiles",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "ClientSequences",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ClientId = table.Column<Guid>(type: "uuid", nullable: false),
                    EntityType = table.Column<string>(type: "text", nullable: false),
                    LastValue = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClientSequences", x => x.Id);
                });

            // Backfill existing data using partition by and row_number
            migrationBuilder.Sql(@"
                -- 1. Backfill ClientContracts
                WITH ranked AS (
                    SELECT ""Id"", row_number() OVER (PARTITION BY ""ClientId"" ORDER BY ""CreatedAt"") as rn
                    FROM ""ClientContracts""
                )
                UPDATE ""ClientContracts"" c
                SET ""SequentialId"" = r.rn
                FROM ranked r
                WHERE c.""Id"" = r.""Id"";

                -- 2. Backfill Orders
                WITH ranked AS (
                    SELECT ""Id"", row_number() OVER (PARTITION BY ""ClientId"" ORDER BY ""CreatedAt"") as rn
                    FROM ""Orders""
                )
                UPDATE ""Orders"" o
                SET ""SequentialId"" = r.rn
                FROM ranked r
                WHERE o.""Id"" = r.""Id"";

                -- 3. Backfill Invoices
                WITH ranked AS (
                    SELECT ""Id"", row_number() OVER (PARTITION BY ""ClientId"" ORDER BY ""CreatedAt"") as rn
                    FROM ""Invoices""
                )
                UPDATE ""Invoices"" i
                SET ""SequentialId"" = r.rn
                FROM ranked r
                WHERE i.""Id"" = r.""Id"";

                -- 4. Backfill BrandingProfiles
                WITH ranked AS (
                    SELECT ""Id"", row_number() OVER (PARTITION BY ""UserId"" ORDER BY ""CreatedAt"") as rn
                    FROM ""BrandingProfiles""
                )
                UPDATE ""BrandingProfiles"" b
                SET ""SequentialId"" = r.rn
                FROM ranked r
                WHERE b.""Id"" = r.""Id"";

                -- 5. Backfill EditingProfiles
                WITH ranked AS (
                    SELECT ""Id"", row_number() OVER (PARTITION BY ""UserId"" ORDER BY ""CreatedAt"") as rn
                    FROM ""EditingProfiles""
                )
                UPDATE ""EditingProfiles"" e
                SET ""SequentialId"" = r.rn
                FROM ranked r
                WHERE e.""Id"" = r.""Id"";

                -- 6. Initialize ClientSequences based on the backfilled data
                INSERT INTO ""ClientSequences"" (""Id"", ""ClientId"", ""EntityType"", ""LastValue"", ""CreatedAt"", ""UpdatedAt"")
                SELECT gen_random_uuid(), ""ClientId"", 'Contract', COALESCE(MAX(""SequentialId""), 0), NOW(), NOW()
                FROM ""ClientContracts""
                GROUP BY ""ClientId""
                ON CONFLICT DO NOTHING;

                INSERT INTO ""ClientSequences"" (""Id"", ""ClientId"", ""EntityType"", ""LastValue"", ""CreatedAt"", ""UpdatedAt"")
                SELECT gen_random_uuid(), ""ClientId"", 'Order', COALESCE(MAX(""SequentialId""), 0), NOW(), NOW()
                FROM ""Orders""
                GROUP BY ""ClientId""
                ON CONFLICT DO NOTHING;

                INSERT INTO ""ClientSequences"" (""Id"", ""ClientId"", ""EntityType"", ""LastValue"", ""CreatedAt"", ""UpdatedAt"")
                SELECT gen_random_uuid(), ""ClientId"", 'Invoice', COALESCE(MAX(""SequentialId""), 0), NOW(), NOW()
                FROM ""Invoices""
                GROUP BY ""ClientId""
                ON CONFLICT DO NOTHING;

                INSERT INTO ""ClientSequences"" (""Id"", ""ClientId"", ""EntityType"", ""LastValue"", ""CreatedAt"", ""UpdatedAt"")
                SELECT gen_random_uuid(), ""UserId"", 'BrandingProfile', COALESCE(MAX(""SequentialId""), 0), NOW(), NOW()
                FROM ""BrandingProfiles""
                GROUP BY ""UserId""
                ON CONFLICT DO NOTHING;

                INSERT INTO ""ClientSequences"" (""Id"", ""ClientId"", ""EntityType"", ""LastValue"", ""CreatedAt"", ""UpdatedAt"")
                SELECT gen_random_uuid(), ""UserId"", 'EditingProfile', COALESCE(MAX(""SequentialId""), 0), NOW(), NOW()
                FROM ""EditingProfiles""
                GROUP BY ""UserId""
                ON CONFLICT DO NOTHING;
            ");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_ClientId_SequentialId",
                table: "Orders",
                columns: new[] { "ClientId", "SequentialId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Invoices_ClientId_SequentialId",
                table: "Invoices",
                columns: new[] { "ClientId", "SequentialId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_EditingProfiles_UserId_SequentialId",
                table: "EditingProfiles",
                columns: new[] { "UserId", "SequentialId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ClientContracts_ClientId_SequentialId",
                table: "ClientContracts",
                columns: new[] { "ClientId", "SequentialId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_BrandingProfiles_UserId_SequentialId",
                table: "BrandingProfiles",
                columns: new[] { "UserId", "SequentialId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ClientSequences_ClientId_EntityType",
                table: "ClientSequences",
                columns: new[] { "ClientId", "EntityType" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ClientSequences");

            migrationBuilder.DropIndex(
                name: "IX_Orders_ClientId_SequentialId",
                table: "Orders");

            migrationBuilder.DropIndex(
                name: "IX_Invoices_ClientId_SequentialId",
                table: "Invoices");

            migrationBuilder.DropIndex(
                name: "IX_EditingProfiles_UserId_SequentialId",
                table: "EditingProfiles");

            migrationBuilder.DropIndex(
                name: "IX_ClientContracts_ClientId_SequentialId",
                table: "ClientContracts");

            migrationBuilder.DropIndex(
                name: "IX_BrandingProfiles_UserId_SequentialId",
                table: "BrandingProfiles");

            migrationBuilder.DropColumn(
                name: "SequentialId",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "SequentialId",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "SequentialId",
                table: "EditingProfiles");

            migrationBuilder.DropColumn(
                name: "SequentialId",
                table: "ClientContracts");

            migrationBuilder.DropColumn(
                name: "SequentialId",
                table: "BrandingProfiles");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_ClientId",
                table: "Orders",
                column: "ClientId");

            migrationBuilder.CreateIndex(
                name: "IX_Invoices_ClientId",
                table: "Invoices",
                column: "ClientId");

            migrationBuilder.CreateIndex(
                name: "IX_EditingProfiles_UserId",
                table: "EditingProfiles",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_ClientContracts_ClientId",
                table: "ClientContracts",
                column: "ClientId");

            migrationBuilder.CreateIndex(
                name: "IX_BrandingProfiles_UserId",
                table: "BrandingProfiles",
                column: "UserId");
        }
    }
}
