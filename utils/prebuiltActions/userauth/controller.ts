import { createNewInterface } from "../../createNew";
import { addUserAuthOptions } from "../../../types";
const compileInterfaces = async ({ options }: addUserAuthOptions) => {
  const interfaceOptions = {
    authInterfaceOptions: {
      options: {
        properties: options.authUserInputs.concat(options.authUserProperties),
        name: "authUserOptions",
        comment:
          "Auth user interface created by the 'add user auth' mechanism of EPB",
        dbSchema: true,
        typeDef: true,
        type: "input",
      },
    },
    publicInterfaceOptionsInput: {
      options: {
        properties: options.publicUserInputs.concat(
          options.publicUserProperties
        ),
        name: "publicUserOptions",
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
        name: "publicUserOptions",
        comment:
          "Public user interface created by the 'add user auth' mechanism of EPB",
        dbSchema: true,
        typeDef: true,
        type: "type",
      },
    },
  };
  const interfaces = {
    authInterface: await createNewInterface(
      interfaceOptions.authInterfaceOptions
    ),
    publicInterface: await createNewInterface(
      interfaceOptions.publicInterfaceOptionsType
    ),
  };
  return interfaces;
};
export const createUserAuthInterfaces = async ({
  options,
}: addUserAuthOptions) => {
  const interfaces = await compileInterfaces({ options: options });
};
