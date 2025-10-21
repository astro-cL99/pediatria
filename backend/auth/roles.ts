export enum Role {
  ADMIN = 'admin',
  DOCTOR = 'doctor',
  NURSE = 'nurse',
  KINESIOLOGIST = 'kinesiologist',
}

export const canAccessPatientData = (role: Role) => {
  return [Role.ADMIN, Role.DOCTOR, Role.NURSE, Role.KINESIOLOGIST].includes(role);
};
