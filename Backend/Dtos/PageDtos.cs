using Backend.Data;

namespace Backend.Dtos;

public record GetPageDto(
    string Url,
    Language Language
);

public record GetComicsPages(
    Language Language
);

public record CreatePageDto(
    PageType PageType,
    List<SetPageContent> Contents,
    string Url
);

public record SetPageContent(
    Language Language,
    string Title,
    string Subtitle
);

public record UpdatePageDto(
    Guid Id,
    List<SetPageContent> Contents,
    string Url
);

public record DeletePageDto(
    Guid Id
);