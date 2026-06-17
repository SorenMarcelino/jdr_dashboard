import { test } from "node:test";
import assert from "node:assert/strict";
import { validateEmail, validatePassword } from "../../utils/validators.mjs";

test("validateEmail accepts valid emails", () => {
    assert.ok(validateEmail("user@example.com"));
    assert.ok(validateEmail("a.b+c@sub.domain.io"));
});

test("validateEmail rejects invalid emails", () => {
    assert.ok(!validateEmail("not-an-email"));
    assert.ok(!validateEmail("missing@tld"));
    assert.ok(!validateEmail(""));
});

test("validatePassword enforces full complexity policy", () => {
    assert.ok(validatePassword("Abcdef1!").isValid);
    assert.ok(!validatePassword("short1!").isValid);        // < 8
    assert.ok(!validatePassword("alllower1!").isValid);     // pas de majuscule
    assert.ok(!validatePassword("ALLUPPER1!").isValid);     // pas de minuscule
    assert.ok(!validatePassword("NoNumber!!").isValid);     // pas de chiffre
    assert.ok(!validatePassword("NoSpecial1").isValid);     // pas de caractère spécial
});
