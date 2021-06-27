import { createNewInterface } from "../../create";
import { createDbSchema } from "../../create";
import { addUserAuthOptions } from "../../../types";

const compileInterfaceOptions = async (
  options: any,
  uniqueIdentifiersPublic: string[],
  uniqueIdentifiersAuth: string[],
  publicUserInputOpts: string[]
) => {
  const avatarInput =
    "avatar: {id:string, title:string, link:string, delete:string}";
  if (options.publicUserInputs.includes(avatarInput)) {
    await createAvatarInterfaces();
    publicUserInputOpts.push("avatarOptions");
  }
  return {
    authInterfaceOptions: {
      options: {
        properties: options.authUserInputs.concat(options.authUserProperties),
        name: "authUser",
        comment:
          "Auth user interface created by the 'add user auth' mechanism of EPB",
        dbSchema: true,
        typeDef: true,
        type: "input",
      },
    },
    authSchemaOptions: {
      options: {
        properties: options.authUserInputs.concat(options.authUserProperties),
        name: "authUser",
        comment:
          "Auth user interface created by the 'add user auth' mechanism of EPB",
        dbSchema: true,
        typeDef: true,
        type: "input",
        uniqueIdentifiers: uniqueIdentifiersAuth,
      },
    },
    publicInterfaceOptionsInput: {
      options: {
        properties: publicUserInputOpts,
        name: "publicUser",
        comment:
          "Public user interface created by the 'add user auth' mechanism of EPB",
        dbSchema: true,
        typeDef: true,
        type: "input",
      },
    },
    publicInterfaceOptionsType: {
      options: {
        properties: options.publicUserInputs.concat(
          options.publicUserProperties
        ),
        name: "publicUser",
        comment:
          "Public user interface created by the 'add user auth' mechanism of EPB",
        dbSchema: true,
        typeDef: true,
        type: "type",
      },
    },
    publicSchemaOptions: {
      options: {
        properties: options.publicUserInputs.concat(
          options.publicUserProperties
        ),
        name: "publicUser",
        comment:
          "Public user interface created by the 'add user auth' mechanism of EPB",
        dbSchema: true,
        typeDef: true,
        type: "input",
        uniqueIdentifiers: uniqueIdentifiersPublic,
      },
    },
  };
};
const parseOptions = ({ options }: addUserAuthOptions) => {
  const uniqueIdentifiersPublic: string[] = [];
  if (options.publicUserInputs.includes("email: string"))
    uniqueIdentifiersPublic.push("email");
  if (options.publicUserInputs.includes("nickName: string"))
    uniqueIdentifiersPublic.push("nickName");
  if (options.publicUserInputs.includes("phone: string"))
    uniqueIdentifiersPublic.push("phone");
  const publicUserInputOpts = options.publicUserInputs.concat(
    options.publicUserProperties
  );
  const uniqueIdentifiersAuth = options.authUserInputs.includes("email:string")
    ? ["username", "email"]
    : ["username"];
  return {
    uniqueIdentifiersPublic,
    uniqueIdentifiersAuth,
    publicUserInputOpts,
  };
};
const createAvatarInterfaces = async () => {
  const avatarInterfaceOptions: any = {
    options: {
      properties: [
        "id: string",
        "title: string",
        "link: string",
        "delete: string",
      ],
      name: "avatar",
      comment:
        "Public user's avatar interface created by the 'add user auth' mechanism of EPB",
      dbSchema: true,
      typeDef: true,
      type: "input",
    },
  };
  await createNewInterface(avatarInterfaceOptions); // create interaface + input typeDef
  avatarInterfaceOptions.options.type = "type";
  await createNewInterface(avatarInterfaceOptions); // create "type" interface for typeDefs
  avatarInterfaceOptions.options.uniqueIdentifiers = [""];
  await createDbSchema(avatarInterfaceOptions); //  + db schema
};
const compileInterfaces = async ({ options }: addUserAuthOptions) => {
  const {
    uniqueIdentifiersPublic,
    uniqueIdentifiersAuth,
    publicUserInputOpts,
  } = parseOptions({ options: options });
  const interfaceOptions = await compileInterfaceOptions(
    options,
    uniqueIdentifiersPublic,
    uniqueIdentifiersAuth,
    publicUserInputOpts
  );
  const interfaces = {
    authInterface: await createNewInterface(
      interfaceOptions.authInterfaceOptions
    ),
    authSchema: await createDbSchema(interfaceOptions.authSchemaOptions),
    publicInterface: await createNewInterface(
      interfaceOptions.publicInterfaceOptionsType
    ),
    publicInterfaceInput: await createNewInterface(
      interfaceOptions.publicInterfaceOptionsInput
    ),
    publicUserSchema: await createDbSchema(
      interfaceOptions.publicSchemaOptions
    ),
  };
  return interfaces;
};
export const addUserAuthToBackend = async ({ options }: addUserAuthOptions) => {
  const interfaces = await compileInterfaces({ options: options });
  return interfaces;
};
