import { getSongPostsDtoCodec, GetSongPostsDto } from "../getSongPostsFromSubreddit.root";


describe("getSongPostsDtoCodec", () => {

    const dto: GetSongPostsDto = {
        subreddit: "someSub",
        type: "hot",
        opts: {
            count: 50,
            before: "t_12345",
            limit: 25
        }
    };

    const improperDto = {
        type: "hhot",
        subreddit: "metalcore"
    } as unknown as GetSongPostsDto;

    it("should decode dto with opts", () => {
        const result = getSongPostsDtoCodec.decode(dto);

        expect(result.isRight()).toBe(true);

        expect(result.extract()).toEqual(dto);

    });

    it("should return a decode error for bad dto", () => {
        const result = getSongPostsDtoCodec.decode(improperDto);

        expect(result.isLeft()).toBe(true);

        expect(typeof result.extract() === "string").toBe(true)
    })
});