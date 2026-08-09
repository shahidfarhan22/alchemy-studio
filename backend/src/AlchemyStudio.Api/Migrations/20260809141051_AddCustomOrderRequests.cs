using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AlchemyStudio.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddCustomOrderRequests : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<Guid>(
                name: "ProductId",
                table: "OrderItems",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.CreateTable(
                name: "CustomOrderRequests",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    ImageUrl = table.Column<string>(type: "text", nullable: true),
                    BudgetMinInPaise = table.Column<long>(type: "bigint", nullable: true),
                    BudgetMaxInPaise = table.Column<long>(type: "bigint", nullable: true),
                    DesiredScale = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<string>(type: "text", nullable: false),
                    QuotedPriceInPaise = table.Column<long>(type: "bigint", nullable: true),
                    QuoteNote = table.Column<string>(type: "text", nullable: true),
                    QuotedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    QuoteExpiresAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    OrderId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CustomOrderRequests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CustomOrderRequests_Orders_OrderId",
                        column: x => x.OrderId,
                        principalTable: "Orders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CustomOrderRequests_OrderId",
                table: "CustomOrderRequests",
                column: "OrderId");

            migrationBuilder.CreateIndex(
                name: "IX_CustomOrderRequests_UserId",
                table: "CustomOrderRequests",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CustomOrderRequests");

            migrationBuilder.AlterColumn<Guid>(
                name: "ProductId",
                table: "OrderItems",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);
        }
    }
}
