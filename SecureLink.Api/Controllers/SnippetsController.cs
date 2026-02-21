using SecureLink.Api.Application.DTOs;
using SecureLink.Api.Application.Services;
using SecureLink.Api.Core.Entities;
using SecureLink.Api.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace SecureLink.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SnippetsController : ControllerBase
{
    private readonly FileShareDbContext _context;

    public SnippetsController(FileShareDbContext context)
    {
        _context = context;
    }

    [HttpPost]
    public async Task<ActionResult<TextSnippet>> CreateSnippet([FromBody] CreateSnippetRequest request)
    {
        var userId = User.Identity?.Name ?? "system";
        
        var snippet = new TextSnippet
        {
            Id = Guid.NewGuid(),
            Title = request.Title,
            Content = request.Content,
            OwnerId = userId,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = request.ExpiryDays.HasValue ? DateTime.UtcNow.AddDays(request.ExpiryDays.Value) : null,
            BurnAfterRead = request.BurnAfterRead
        };

        _context.TextSnippets.Add(snippet);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetSnippet), new { id = snippet.Id }, snippet);
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<ActionResult<TextSnippet>> GetSnippet(Guid id)
    {
        var snippet = await _context.TextSnippets.FindAsync(id);
        if (snippet == null) return NotFound();

        if (snippet.ExpiresAt.HasValue && snippet.ExpiresAt < DateTime.UtcNow)
        {
            _context.TextSnippets.Remove(snippet);
            await _context.SaveChangesAsync();
            return Gone();
        }

        if (snippet.BurnAfterRead)
        {
            // We return the content then delete it
            // In a real app, we might want to return it and mark it for deletion
            var result = new TextSnippet
            {
                Id = snippet.Id,
                Title = snippet.Title,
                Content = snippet.Content,
                CreatedAt = snippet.CreatedAt
            };
            _context.TextSnippets.Remove(snippet);
            await _context.SaveChangesAsync();
            return result;
        }

        return snippet;
    }

    private ActionResult Gone() => StatusCode(StatusCodes.Status410Gone, "Snippet has expired");
}
