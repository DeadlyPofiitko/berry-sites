using Backend.Data;

namespace Backend.Dtos;

public record GetContentDto(
    Language Language,
    string Name
);

public record CreateSectionDto(
    string Name
);

public record DeleteSectionDto(
    Guid Id
);

public record UpdateSectionContentDto(
    Guid Id,
    string Content
);