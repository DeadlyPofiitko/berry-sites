using Backend.Data;

namespace Backend.Dtos;

public record GetNavLinksDto(
    Language Language
);

public record GetAllLinkContentsDto(
    Language Language,
    string Name
);

public record GetAllLinksDto(
    Guid Id,
    string Url,
    int Order,
    List<GetAllLinkContentsDto> Contents
);

public record NavLinkContentDto(
    Language Language,
    string Name
); 

public record NavLinkDto(
    Guid Id,
    string Url,
    int Order,
    List<NavLinkContentDto> Contents
);

public record SyncNavLinksDto(
    List<NavLinkDto> NavLinkDtos
);