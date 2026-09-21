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
    string Url
);

public record UpdatePageContent(
    Language Language,
    string Title,
    string Subtitle
);

public record UpdatePageDto(
    Guid Id,
    List<UpdatePageContent> Contents,
    string Url
);

public record DeletePage(
    Guid Id
);