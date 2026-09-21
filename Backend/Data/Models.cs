
namespace Backend.Data;

public class Admin
{
    public Guid Id { get; set; }
    public required string Email { get; set; }
    public string? Name { get; set; }
    public string? ProviderId { get; set; }
    public string? Picture { get; set; }
}

public enum Language
{
    EN,
    CS
}

public class Image
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public int Width { get; set; }
    public int Height { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public List<ImagePattern> ImagePatterns { get; set; } = [];
}

public class Pattern
{
    public Guid Id { get; set; }
    public int Order { get; set; }
    public List<ImagePattern> ImagePatterns { get; set; } = [];
    public Guid PageId { get; set; }
    public Page Page { get; set; } = default!;
}

public class ImagePattern
{
    public Guid ImageId { get; set; }
    public Image Image { get; set; } = default!;
    public Guid PatternId { get; set; }
    public Pattern Pattern { get; set; } = default!;
    public int Order { get; set; }
}

public class PageContent
{
    public Guid Id { get; set; }
    public required string Title { get; set; }
    public required string Subtitle { get; set; }
    public Language Language { get; set; }
    public Guid PageId { get; set; }
    public Page Page { get; set; } = default!;
}

public enum PageType
{
    STANDART,
    COMICS
}

public class Page
{
    public Guid Id { get; set; }
    public PageType PageType { get; set; }
    public required string Url { get; set; }
    public List<PageContent> Contents { get; set; } = [];
    public List<Pattern> Patterns { get; set; } = [];
}

public class Section
{
    public Guid Id { get; set; }
    
    public required string Name { get; set; }

    public List<SectionContent> Contents { get; set; } = [];
}

public class SectionContent
{
    public Guid Id { get; set; }

    public Language Language { get; set; }

    public required string Json { get; set; }
    
    public Guid SectionId { get; set; }

    public Section Section { get; set; } = default!;
}
public class NavLink
{
    public Guid Id { get; set; }

    public List<NavLinkContent> Contents { get; set; } = [];

    public required string Url { get; set; }
    public int Order { get; set; }
}

public class NavLinkContent
{
    public Guid Id { get; set; }

    public Language Language { get; set; }

    public required string Name { get; set; }
    
    public Guid NavLinkId { get; set; }
    
    public NavLink NavLink { get; set; } = default!;
}