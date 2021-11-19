import { TrackInfo }                        from "@/music/types";
import * as R                               from "ramda";
import { titleToTrackInfoSafe, trackRegex } from "../postParsing";


const shouldMatchTitleCases = [
    [
        "Mirrors - Cold Sanctuary",
        [ "Mirrors", "Cold Sanctuary" ] ],
    [
        "Varials - Bleeding (Official Music Video)",
        [ "Varials", "Bleeding" ] ],
    [
        "Northlane - \"Echo Chamber\" [Official Music Video]",
        [ "Northlane", "Echo Chamber" ] ],
    [
        "If I Die First - Where Needles and Lovers Collide",
        [ "If I Die First", "Where Needles and Lovers Collide" ]
    ],
    [
        "LIFESICK - Idolising Crooks (Official Music Video)(FFO Nails, END, Harms Way, HM2-core)",
        [ "LIFESICK", "Idolising Crooks" ]
    ],
    [
        "(2021) A War Inside - ‘Apeiron’ (For fans of Currents/Architects/Northlane)",
        [ "A War Inside", "Apeiron" ]
    ],
    [
        "Stavesacre - Colt .45 [Alternative Rock/Hard Rock/Hardcore] (1997)",
        ["Stavesacre", "Colt .45"]
    ],
    [
        "Daedric -- Sepulchre [Electronic Rock] (2021)",
        ["Daedric", "Sepulchre"]
    ],
    [
        "Hulkoff - Jormungandr [Power metal] (2021)",
        ["Hulkoff", "Jormungandr"]
    ]
];

const shouldNotMatchTitleCases = [
    "We're playing a show, and you're invited!",
    "Weekly Release Thread: November 12th"
];


describe("trackRegex", () => {

    it.each(shouldMatchTitleCases)("should match %s => %s", (input, exp) => {

        const result = R.match(trackRegex, input as any);

        const expArr = [ input, ...exp ] as string[];

        expect(JSON.stringify(result)).toEqual(JSON.stringify(expArr));
    });
});

describe("titleToTrackInfoSafe", () => {

    it.each(shouldMatchTitleCases)("should return Just(TrackInfo): %s", (input, exp) => {

        const result = titleToTrackInfoSafe(input as string);
        const [ artist, title ] = exp;

        const expInfo: TrackInfo = {
            artist,
            title
        };

        expect(result.isJust()).toBe(true);
        expect(result.extract()).toEqual(expInfo);
    });

    it.each(shouldNotMatchTitleCases)("should return Nothing: %s", (input) => {
        const result = titleToTrackInfoSafe(input);

        expect(result.extractNullable()).toBe(null);
    });
});




