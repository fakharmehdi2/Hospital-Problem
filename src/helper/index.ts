import { object, string, number, date, mixed, boolean } from "yup";
import { isValidObjectId } from "mongoose";
import { Response } from "express";
import { CURRENCY, NO_OF_LEGS } from "helper/enums";
import { isEmpty } from "lodash";
import winston from "winston";
import Appointment from "models/appointment";
import { SERVER } from "data";

export const validatePatient = async (patient: any) => {
  const patientSchema = object({
    name: string().required().trim().min(3).max(35),
    ownerName: string().required().trim().min(3).max(35),
    ownerAddress: string().required().trim().min(3).max(200),
    ownerPhone: string().required().trim().min(11).max(15),
    noOfLegs: mixed<NO_OF_LEGS>().oneOf(Object.values(NO_OF_LEGS)).required(),
    currency: mixed<CURRENCY>().oneOf(Object.values(CURRENCY)).required(),
  });
  return await patientSchema.validate(patient, { strict: true });
};

export const validateObjectId = (res: Response, id: any) => {
  // if (!id) throw new Error("Id not Found");
  throwForNoExistence(res, id, "Id Not Found", 400);
  throwForNoExistence(res, isValidObjectId(id), "Invalid Id", 404);

  // if (!isValidObjectId(id)) throwException(res, "Invalid Id", 400);
  return true;
};

export const throwException = (
  res: Response,
  message?: string,
  code?: number
) => {
  res.status(code || SERVER.ERROR_CODE);
  throw new Error(message || SERVER.ERROR_MESSAGE);
};

export const getAll = async (Class: any, res: Response, name: string) => {
  const result = await Class.find();
  if (isEmpty(result)) res.status(404).send(logger(`No ${name} Found`));
  else sendAndLog(res, `Sent All ${result}`);
};

export const logger = (message: string, type: string = "info") => {
  if (type === "info") winston.info(`Response Sent: ${message}`);
  else if (type === "error") winston.error(`Response Sent: ${message}`);
  return message;
};

export const sendAndLog = (res: Response, message: string) => {
  res.send(logger(message));
};

export const validateAppointment = async (appointment: any) => {
  const appointmentSchema = object({
    sTime: number().required().min(0).max(23),
    eTime: number().required().min(1).max(24),
    desc: string().required().trim().min(3).max(35),
    fee: number().min(0),
    pId: string().min(24).max(24),
    date: date(),
    isFeePaid: boolean(),
    currency: mixed<CURRENCY>().oneOf(Object.values(CURRENCY)).required(),
  });
  //implement This
  // if (appointment.sTime >= appointment.eTime)
  //   throw new Error("Appointment MUST be started before its ended");
  throwOnlyError(
    !(appointment.sTime >= appointment.eTime),
    "Appointment MUST be started before its ended"
  );
  return await appointmentSchema.validate(appointment), { strict: true };
};

export const throwOnlyError = (element: any, message?: string) => {
  if (!checkExistence(element))
    throw new Error(message || SERVER.ERROR_MESSAGE);
};
export const getAppointmentsForPatient = async (res: Response, pId: any) => {
  const appointments = await Appointment.find({ pId }).select({
    _id: 0,
    pId: 0,
  });
  if (isEmpty(appointments))
    res.status(404).send(logger("No Appointments Found"));
  else sendAndLog(res, `Got All\n${appointments}`);
};

export const getAppointmentsForDay = async (res: Response, date: Date) => {
  const appointments = await Appointment.find({ date }).select({
    _id: 0,
    pId: 0,
  });
  isEmpty(appointments)
    ? res.status(404).send(logger(`No Appointments found for day: ${date}`))
    : sendAndLog(res, `Got ${appointments}`);
};

export const checkExistence = (element: any[] | any) =>
  Array.isArray(element) ? element.length > 0 : !!element;

export const throwForNoExistence = (
  res: Response,
  data: any,
  message?: string,
  code?: number
) => {
  if (!checkExistence(data))
    throwException(
      res,
      message || SERVER.ERROR_MESSAGE,
      code || SERVER.ERROR_CODE
    );
  return;
};

// if (element instanceof Array) return element && element.length ? true : false;
// if (Array.isArray(element)) return element.length > 0;
// return element ? true : false;
