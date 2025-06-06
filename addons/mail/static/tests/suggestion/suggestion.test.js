import {
    click,
    contains,
    defineMailModels,
    insertText,
    onRpcBefore,
    openDiscuss,
    openFormView,
    start,
    startServer,
} from "@mail/../tests/mail_test_helpers";
import { beforeEach, expect, describe, test } from "@odoo/hoot";
import { Deferred, tick } from "@odoo/hoot-mock";
import {
    asyncStep,
    Command,
    onRpc,
    patchWithCleanup,
    serverState,
} from "@web/../tests/web_test_helpers";

import { Composer } from "@mail/core/common/composer";
import { press } from "@odoo/hoot-dom";

describe.current.tags("desktop");
defineMailModels();

beforeEach(() => {
    // Simulate real user interactions
    patchWithCleanup(Composer.prototype, {
        isEventTrusted() {
            return true;
        },
    });
});

test('display partner mention suggestions on typing "@"', async () => {
    const pyEnv = await startServer();
    const partnerId_1 = pyEnv["res.partner"].create({
        email: "testpartner@odoo.com",
        name: "TestPartner",
    });
    const partnerId_2 = pyEnv["res.partner"].create({
        email: "testpartner2@odoo.com",
        name: "TestPartner2",
    });
    pyEnv["res.users"].create({ partner_id: partnerId_1 });
    const channelId = pyEnv["discuss.channel"].create({
        name: "general",
        channel_member_ids: [
            Command.create({ partner_id: serverState.partnerId }),
            Command.create({ partner_id: partnerId_1 }),
            Command.create({ partner_id: partnerId_2 }),
        ],
    });
    await start();
    await openDiscuss(channelId);
    await insertText(".o-mail-Composer-input", "@");
    await contains(".o-mail-Composer-suggestion strong", { count: 3 });
});

test("can @user in restricted (group_public_id) channels", async () => {
    const pyEnv = await startServer();
    const groupId = pyEnv["res.groups"].create({
        name: "Custom Channel Group",
    });
    const [partnerId_1, partnerId_2] = pyEnv["res.partner"].create([
        { email: "testpartner1@odoo.com", name: "TestPartner1" },
        { email: "testpartner2@odoo.com", name: "TestPartner2" },
    ]);
    pyEnv["res.users"].create([
        { partner_id: partnerId_1, group_ids: [Command.link(groupId)] },
        { partner_id: partnerId_2 },
    ]);
    const channelId = pyEnv["discuss.channel"].create({
        name: "Restricted Channel",
        group_public_id: groupId,
        channel_type: "channel",
    });
    await start();
    await openDiscuss(channelId);
    await click("button[title='Invite People']");
    await contains(".o-discuss-ChannelInvitation-invitationBox", {
        text: 'Access restricted to group "Custom Channel Group"',
    });
    await insertText(".o-mail-Composer-input", "@");
    await contains(".o-mail-Composer-suggestion strong", { count: 2 });
});

test('post a first message then display partner mention suggestions on typing "@"', async () => {
    const pyEnv = await startServer();
    const partnerId_1 = pyEnv["res.partner"].create({
        email: "testpartner@odoo.com",
        name: "TestPartner",
    });
    const partnerId_2 = pyEnv["res.partner"].create({
        email: "testpartner2@odoo.com",
        name: "TestPartner2",
    });
    pyEnv["res.users"].create({ partner_id: partnerId_1 });
    const channelId = pyEnv["discuss.channel"].create({
        name: "general",
        channel_member_ids: [
            Command.create({ partner_id: serverState.partnerId }),
            Command.create({ partner_id: partnerId_1 }),
            Command.create({ partner_id: partnerId_2 }),
        ],
    });
    await start();
    await openDiscuss(channelId);
    await contains(".o-mail-Composer-input");
    await insertText(".o-mail-Composer-input", "first message");
    await press("Enter");
    await contains(".o-mail-Message");
    await insertText(".o-mail-Composer-input", "@");
    await contains(".o-mail-Composer-suggestion strong", { count: 3 });
});

test('display partner mention suggestions on typing "@" in chatter', async () => {
    await startServer();
    await start();
    await openFormView("res.partner", serverState.partnerId);
    await click("button", { text: "Send message" });
    await insertText(".o-mail-Composer-input", "@");
    await contains(".o-mail-Composer-suggestion strong", { text: "Mitchell Admin" });
});

test("Do not fetch if search more specific and fetch had no result", async () => {
    await startServer();
    onRpc("res.partner", "get_mention_suggestions", () => {
        asyncStep("get_mention_suggestions");
    });
    await start();
    await openFormView("res.partner", serverState.partnerId);
    await click("button", { text: "Send message" });
    await insertText(".o-mail-Composer-input", "@");
    await contains(".o-mail-Composer-suggestion", { count: 3 }); // Mitchell Admin, Hermit, Public user
    await contains(".o-mail-Composer-suggestion", { text: "Mitchell Admin" });
    await expect.waitForSteps(["get_mention_suggestions"]);
    await insertText(".o-mail-Composer-input", "x");
    await contains(".o-mail-Composer-suggestion", { count: 0 });
    await expect.waitForSteps(["get_mention_suggestions"]);
    await insertText(".o-mail-Composer-input", "x");
    await expect.waitForSteps([]);
});

test("show other channel member in @ mention", async () => {
    const pyEnv = await startServer();
    const partnerId = pyEnv["res.partner"].create({
        email: "testpartner@odoo.com",
        name: "TestPartner",
    });
    const channelId = pyEnv["discuss.channel"].create({
        name: "general",
        channel_member_ids: [
            Command.create({ partner_id: serverState.partnerId }),
            Command.create({ partner_id: partnerId }),
        ],
    });
    await start();
    await openDiscuss(channelId);
    await insertText(".o-mail-Composer-input", "@");
    await contains(".o-mail-Composer-suggestion strong", { text: "TestPartner" });
});

test("select @ mention insert mention text in composer", async () => {
    const pyEnv = await startServer();
    const partnerId = pyEnv["res.partner"].create({
        email: "testpartner@odoo.com",
        name: "TestPartner",
    });
    const channelId = pyEnv["discuss.channel"].create({
        name: "general",
        channel_member_ids: [
            Command.create({ partner_id: serverState.partnerId }),
            Command.create({ partner_id: partnerId }),
        ],
    });
    await start();
    await openDiscuss(channelId);
    await insertText(".o-mail-Composer-input", "@");
    await click(".o-mail-Composer-suggestion strong", { text: "TestPartner" });
    await contains(".o-mail-Composer-input", { value: "@TestPartner " });
});

test("select @ mention closes suggestions", async () => {
    const pyEnv = await startServer();
    const partnerId = pyEnv["res.partner"].create({
        email: "testpartner@odoo.com",
        name: "TestPartner",
    });
    const channelId = pyEnv["discuss.channel"].create({
        name: "general",
        channel_member_ids: [
            Command.create({ partner_id: serverState.partnerId }),
            Command.create({ partner_id: partnerId }),
        ],
    });
    await start();
    await openDiscuss(channelId);
    await insertText(".o-mail-Composer-input", "@");
    await click(".o-mail-Composer-suggestion strong", { text: "TestPartner" });
    await contains(".o-mail-Composer-suggestion strong", { count: 0 });
});

test('display channel mention suggestions on typing "#"', async () => {
    const pyEnv = await startServer();
    const channelId = pyEnv["discuss.channel"].create({
        name: "General",
        channel_type: "channel",
    });
    await start();
    await openDiscuss(channelId);
    await contains(".o-mail-Composer-suggestionList");
    await contains(".o-mail-Composer-suggestionList .o-open", { count: 0 });
    await insertText(".o-mail-Composer-input", "#");
    await contains(".o-mail-Composer-suggestionList .o-open");
});

test("mention a channel", async () => {
    const pyEnv = await startServer();
    const channelId = pyEnv["discuss.channel"].create({
        name: "General",
        channel_type: "channel",
    });
    await start();
    await openDiscuss(channelId);
    await contains(".o-mail-Composer-suggestionList");
    await contains(".o-mail-Composer-suggestionList .o-open", { count: 0 });
    await contains(".o-mail-Composer-input", { value: "" });
    await insertText(".o-mail-Composer-input", "#");
    await click(".o-mail-Composer-suggestion");
    await contains(".o-mail-Composer-input", { value: "#General " });
});

test("mention a channel thread", async () => {
    const pyEnv = await startServer();
    const channelId = pyEnv["discuss.channel"].create({
        name: "General",
        channel_type: "channel",
    });
    pyEnv["discuss.channel"].create({
        name: "ThreadOne",
        parent_channel_id: channelId,
    });
    await start();
    await openDiscuss(channelId);
    await contains(".o-mail-Composer-suggestionList");
    await contains(".o-mail-Composer-suggestionList .o-open", { count: 0 });
    await contains(".o-mail-Composer-input", { value: "" });
    await insertText(".o-mail-Composer-input", "#");
    await contains(".o-mail-Composer-suggestion", { count: 2 });
    await contains(".o-mail-Composer-suggestion:eq(0):has(i.fa-hashtag)", { text: "General" });
    await contains(".o-mail-Composer-suggestion:eq(1):has(i.fa-comments-o)", {
        text: "GeneralThreadOne",
    });
    await click(".o-mail-Composer-suggestion:eq(1)");
    await contains(".o-mail-Composer-input", { value: "#General > ThreadOne " });
    await press("Enter");
    await contains(".o-mail-Message a.o_channel_redirect:has(i.fa-comments-o)", {
        text: "General > ThreadOne",
    });
    await click("a.o_channel_redirect", { text: "General > ThreadOne" });
    await contains(".o-mail-DiscussSidebar-item.o-active", { text: "ThreadOne" });
});

test("Channel suggestions do not crash after rpc returns", async () => {
    const pyEnv = await startServer();
    const channelId = pyEnv["discuss.channel"].create({ name: "general" });
    const deferred = new Deferred();
    onRpc("discuss.channel", "get_mention_suggestions", () => {
        asyncStep("get_mention_suggestions");
        deferred.resolve();
    });
    await start();
    await openDiscuss(channelId);
    pyEnv["discuss.channel"].create({ name: "foo" });
    await insertText(".o-mail-Composer-input", "#");
    await tick();
    await insertText(".o-mail-Composer-input", "f");
    await deferred;
    await expect.waitForSteps(["get_mention_suggestions"]);
});

test("Suggestions are shown after delimiter was used in text (@)", async () => {
    const pyEnv = await startServer();
    const channelId = pyEnv["discuss.channel"].create({ name: "General" });
    await start();
    await openDiscuss(channelId);
    await insertText(".o-mail-Composer-input", "@");
    await contains(".o-mail-Composer-suggestion");
    await insertText(".o-mail-Composer-input", "NonExistingUser");
    await contains(".o-mail-Composer-suggestion strong", { count: 0 });
    await insertText(".o-mail-Composer-input", " @");
    await contains(".o-mail-Composer-suggestion strong", { text: "Mitchell Admin" });
});

test("Suggestions are shown after delimiter was used in text (#)", async () => {
    const pyEnv = await startServer();
    const channelId = pyEnv["discuss.channel"].create({ name: "General" });
    await start();
    await openDiscuss(channelId);
    await insertText(".o-mail-Composer-input", "#");
    await contains(".o-mail-Composer-suggestion");
    await insertText(".o-mail-Composer-input", "NonExistingChannel");
    await contains(".o-mail-Composer-suggestion strong", { count: 0 });
    await insertText(".o-mail-Composer-input", " #");
    await contains(".o-mail-Composer-suggestion strong", { text: "General" });
});

test("display partner mention when typing more than 2 words if they match", async () => {
    const pyEnv = await startServer();
    pyEnv["res.partner"].create([
        {
            email: "test1@example.com",
            name: "My Best Partner",
        },
        {
            email: "test2@example.com",
            name: "My Test User",
        },
        {
            email: "test3@example.com",
            name: "My Test Partner",
        },
    ]);
    await start();
    await openFormView("res.partner", serverState.partnerId);
    await click("button", { text: "Send message" });
    await insertText(".o-mail-Composer-input", "@My ");
    await contains(".o-mail-Composer-suggestion strong", { count: 3 });
    await insertText(".o-mail-Composer-input", "Test ");
    await contains(".o-mail-Composer-suggestion strong", { count: 2 });
    await insertText(".o-mail-Composer-input", "Partner");
    await contains(".o-mail-Composer-suggestion");
    await contains(".o-mail-Composer-suggestion strong", { text: "My Test Partner" });
});

test("Internal user should be displayed first", async () => {
    const pyEnv = await startServer();
    const [user1Id, user2Id] = pyEnv["res.users"].create([{}, {}]);
    const partnerIds = pyEnv["res.partner"].create([
        { name: "Person A" },
        { name: "Person B" },
        { name: "Person C", user_ids: [user1Id] },
        { name: "Person D", user_ids: [user2Id] },
    ]);
    pyEnv["mail.followers"].create([
        {
            is_active: true,
            partner_id: partnerIds[1], // B
            res_id: serverState.partnerId,
            res_model: "res.partner",
        },
        {
            is_active: true,
            partner_id: partnerIds[3], // D
            res_id: serverState.partnerId,
            res_model: "res.partner",
        },
    ]);
    await start();
    await openFormView("res.partner", serverState.partnerId);
    await click("button", { text: "Send message" });
    await insertText(".o-mail-Composer-input", "@Person ");
    await contains(":nth-child(1 of .o-mail-Composer-suggestion) strong", { text: "Person D" });
    await contains(":nth-child(2 of .o-mail-Composer-suggestion) strong", { text: "Person C" });
    await contains(":nth-child(3 of .o-mail-Composer-suggestion) strong", { text: "Person B" });
    await contains(":nth-child(4 of .o-mail-Composer-suggestion) strong", { text: "Person A" });
});

test("Current user that is a follower should be considered as such", async () => {
    const pyEnv = await startServer();
    const userId = pyEnv["res.users"].create({});
    pyEnv["res.partner"].create([
        { email: "a@test.com", name: "Person A" },
        { email: "b@test.com", name: "Person B", user_ids: [userId] },
    ]);
    pyEnv["mail.followers"].create([
        {
            is_active: true,
            partner_id: serverState.partnerId,
            res_id: serverState.partnerId,
            res_model: "res.partner",
        },
    ]);
    await start();
    await openFormView("res.partner", serverState.partnerId);
    await click("button", { text: "Send message" });
    await insertText(".o-mail-Composer-input", "@");
    await contains(".o-mail-Composer-suggestion", { count: 5 }); // FIXME: should be 3, but +2 extra with Hermit / Public User
    await contains(".o-mail-Composer-suggestion", {
        text: "Mitchell Admin",
        before: [".o-mail-Composer-suggestion", { text: "Person B(b@test.com)" }],
    });
    await contains(".o-mail-Composer-suggestion", {
        text: "Person B(b@test.com)",
        before: [".o-mail-Composer-suggestion", { text: "Person A(a@test.com)" }],
    });
});

test("Mention with @everyone", async () => {
    const pyEnv = await startServer();
    const channelId = pyEnv["discuss.channel"].create({
        name: "General",
        channel_type: "channel",
    });
    await start();
    await openDiscuss(channelId);
    await contains(".o-mail-Composer-suggestionList");
    await contains(".o-mail-Composer-suggestionList .o-open", { count: 0 });
    await contains(".o-mail-Composer-input", { value: "" });
    await insertText(".o-mail-Composer-input", "@ever");
    await click(".o-mail-Composer-suggestion");
    await contains(".o-mail-Composer-input", { value: "@everyone " });
    await press("Enter");
    await contains(".o-mail-Message-bubble.o-orange");
    await contains(".o-mail-Message a:contains('@everyone')");
});

test("Suggestions that begin with the search term should have priority", async () => {
    const pyEnv = await startServer();
    pyEnv["res.partner"].create([{ name: "Party Partner" }, { name: "Best Partner" }]);
    await start();
    await openFormView("res.partner", serverState.partnerId);
    await click("button", { text: "Send message" });
    await insertText(".o-mail-Composer-input", "@");
    await contains(".o-mail-Composer-suggestion", {
        text: "Best Partner",
        before: [".o-mail-Composer-suggestion", { text: "Party Partner" }],
    });
    await insertText(".o-mail-Composer-input", "part");
    await contains(".o-mail-Composer-suggestion", {
        text: "Party Partner",
        before: [".o-mail-Composer-suggestion", { text: "Best Partner" }],
    });
});

test("Mention with @-role", async () => {
    const pyEnv = await startServer();
    const [roleId1, roleId2] = pyEnv["res.role"].create([
        { name: "rd-Discuss" },
        { name: "rd-JS" },
    ]);
    const [userId1, userId2, userId3] = pyEnv["res.users"].create([
        {
            role_ids: [roleId1],
        },
        {
            role_ids: [roleId2],
        },
        {
            role_ids: [roleId1, roleId2],
        },
    ]);
    const [partnerId1, partnerId2, partnerId3] = pyEnv["res.partner"].create([
        { name: "Person A", user_ids: [userId1] },
        { name: "Person B", user_ids: [userId2] },
        { name: "Person C", user_ids: [userId3] },
    ]);
    const channelId = pyEnv["discuss.channel"].create({
        name: "General",
        channel_type: "channel",
        channel_member_ids: [
            Command.create({ partner_id: serverState.partnerId }),
            Command.create({ partner_id: partnerId1 }),
            Command.create({ partner_id: partnerId2 }),
            Command.create({ partner_id: partnerId3 }),
        ],
    });
    await start();
    await openDiscuss(channelId);
    await contains(".o-mail-Composer-suggestionList");
    await contains(".o-mail-Composer-suggestionList .o-open", { count: 0 });
    await contains(".o-mail-Composer-input", { value: "" });
    await insertText(".o-mail-Composer-input", "@discuss");
    await click(".o-mail-Composer-suggestion");
    await contains(".o-mail-Composer-input", { value: "@rd-Discuss " });
    await press("Enter");
    await contains(".o-mail-Message a.o-discuss-mention", {
        text: "@rd-Discuss",
    });
});

test("Mention with @-role send correct role id", async () => {
    const pyEnv = await startServer();
    const [roleId1, roleId2] = pyEnv["res.role"].create([
        { name: "rd-Discuss" },
        { name: "rd-JS" },
    ]);
    const [userId1, userId2, userId3] = pyEnv["res.users"].create([
        {
            role_ids: [roleId1],
        },
        {
            role_ids: [roleId2],
        },
        {
            role_ids: [roleId1, roleId2],
        },
    ]);
    const [partnerId1, partnerId2, partnerId3] = pyEnv["res.partner"].create([
        { name: "Person A", user_ids: [userId1] },
        { name: "Person B", user_ids: [userId2] },
        { name: "Person C", user_ids: [userId3] },
    ]);
    const channelId = pyEnv["discuss.channel"].create({
        name: "General",
        channel_type: "channel",
        channel_member_ids: [
            Command.create({ partner_id: serverState.partnerId }),
            Command.create({ partner_id: partnerId1 }),
            Command.create({ partner_id: partnerId2 }),
            Command.create({ partner_id: partnerId3 }),
        ],
    });
    onRpcBefore("/mail/message/post", (args) => {
        asyncStep("message_post");
        expect(args.post_data.role_ids).toEqual([roleId1]);
    });
    await start();
    await openDiscuss(channelId);
    await contains(".o-mail-Composer-suggestionList");
    await contains(".o-mail-Composer-suggestionList .o-open", { count: 0 });
    await contains(".o-mail-Composer-input", { value: "" });
    await insertText(".o-mail-Composer-input", "@discuss");
    await click(".o-mail-Composer-suggestion");
    await contains(".o-mail-Composer-input", { value: "@rd-Discuss " });
    await press("Enter");
    await contains(".o-mail-Message a.o-discuss-mention", {
        text: "@rd-Discuss",
    });
    await expect.waitForSteps(["message_post"]);
});

test("Mention with @-role trigger one RPC only", async () => {
    const pyEnv = await startServer();
    const [roleId1, roleId2] = pyEnv["res.role"].create([
        { name: "rd-Discuss" },
        { name: "rd-JS" },
    ]);
    const [userId1, userId2, userId3] = pyEnv["res.users"].create([
        {
            role_ids: [roleId1],
        },
        {
            role_ids: [roleId2],
        },
        {
            role_ids: [roleId1, roleId2],
        },
    ]);
    const [partnerId1, partnerId2, partnerId3] = pyEnv["res.partner"].create([
        { name: "Discuss guru", user_ids: [userId1] },
        { name: "Person B", user_ids: [userId2] },
        { name: "Person C", user_ids: [userId3] },
    ]);
    const channelId = pyEnv["discuss.channel"].create({
        name: "General",
        channel_type: "channel",
        channel_member_ids: [
            Command.create({ partner_id: serverState.partnerId }),
            Command.create({ partner_id: partnerId1 }),
            Command.create({ partner_id: partnerId2 }),
            Command.create({ partner_id: partnerId3 }),
        ],
    });
    pyEnv["mail.message"].create({
        body: "message fetched",
        model: "discuss.channel",
        res_id: channelId,
    });
    await start();
    await openDiscuss(channelId);
    await contains(".o-mail-Composer-suggestionList");
    await contains(".o-mail-Composer-suggestionList .o-open", { count: 0 });
    /**
     * Wait for messages and members to be fetched before listening to network calls to avoid
     * catching irrelevant calls.
     */
    await contains(".o-mail-Message", { text: "message fetched" });
    await contains(".o-discuss-ChannelMember", { text: "Discuss guru" });
    await contains(".o-mail-Composer-input", { value: "" });
    onRpc("/*", (request) => {
        const route = new URL(request.url).pathname;
        if (route !== "/discuss/channel/notify_typing") {
            expect.step(route);
        }
    });
    await insertText(".o-mail-Composer-input", "@discuss");
    await contains(".o-mail-Composer-suggestion strong", { text: "Discuss guru" });
    await contains(".o-mail-Composer-suggestion strong", { text: "rd-Discuss" });
    await expect.waitForSteps([
        "/web/dataset/call_kw/res.partner/get_mention_suggestions_from_channel",
    ]);
});
