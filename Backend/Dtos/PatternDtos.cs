using Backend.Data;

namespace Backend.Dtos;

public record GetPagePatternsDto(
    Guid PageId
);

public record CreatePatternDto(
    Guid PageId,
    PatternType PatternType
);

public record SetPattern(
    Guid PatternId,
    List<Guid> ImageIdsOrder
);

public record ChangePatternDto(
    Guid PageId,
    List<SetPattern> PatternsOrder
);

public record DeletePatternDto(
    Guid PatternId
);