namespace Backend.Dtos;

public record ImageUploadItem(
    string? Name,
    IFormFile File
);

public record BatchUploadDto(
    List<ImageUploadItem> Items
);

public record DeleteImageDto(
    Guid Id
);