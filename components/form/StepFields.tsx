"use client";

import { Field, fieldClass, optionGridClass, OptionButton } from "@/components/ui";
import {
  MULTI_SELECT_HINT,
  OTHER_HINT,
  OTHER_ID,
  OTHER_LABEL,
  SINGLE_SELECT_HINT,
  hasOtherSelected,
  listValue,
  textValue,
  toggleInList,
  type AnswerValue,
  type FormField,
  type FormStep,
  type RequirementData,
} from "@/lib/form";

type ChangeHandler = (data: RequirementData) => void;

function requiredLabel(field: FormField) {
  return field.required ? `${field.label} *` : field.label;
}

/** Renders every field of one step; used by the customer wizard and the admin preview. */
export function StepFields({
  step,
  data,
  disabled = false,
  onChange,
}: {
  step: FormStep;
  data: RequirementData;
  disabled?: boolean;
  onChange: ChangeHandler;
}) {
  function setValue(key: string, value: AnswerValue) {
    onChange({ ...data, values: { ...data.values, [key]: value } });
  }
  function setOther(key: string, value: string) {
    onChange({ ...data, other: { ...data.other, [key]: value } });
  }

  return (
    <div className="grid gap-6">
      {step.fields.map((field) => (
        <div key={field.key} className="space-y-3">
          <FieldInput field={field} data={data} disabled={disabled} setValue={setValue} />
          {hasOtherSelected(field, data) && (
            <Field label={`${field.otherLabel || OTHER_LABEL} *`} hint={OTHER_HINT}>
              <input
                className={fieldClass}
                value={data.other[field.key] ?? ""}
                disabled={disabled}
                placeholder={field.otherPlaceholder}
                onChange={(event) => setOther(field.key, event.target.value)}
              />
            </Field>
          )}
        </div>
      ))}
    </div>
  );
}

function FieldInput({
  field,
  data,
  disabled,
  setValue,
}: {
  field: FormField;
  data: RequirementData;
  disabled: boolean;
  setValue: (key: string, value: AnswerValue) => void;
}) {
  const label = requiredLabel(field);

  if (field.type === "text" || field.type === "textarea") {
    const props = {
      className: field.type === "textarea" ? `${fieldClass} min-h-24` : fieldClass,
      value: textValue(data, field.key),
      disabled,
      placeholder: field.placeholder,
      onChange: (event: { target: { value: string } }) => setValue(field.key, event.target.value),
    };
    return (
      <Field label={label} hint={field.hint}>
        {field.type === "textarea" ? <textarea {...props} /> : <input {...props} />}
      </Field>
    );
  }

  if (field.type === "select") {
    return (
      <Field label={label} hint={field.hint}>
        <select
          className={fieldClass}
          value={textValue(data, field.key)}
          disabled={disabled}
          onChange={(event) => setValue(field.key, event.target.value)}
        >
          {!field.defaultValue && <option value="">{field.placeholder || "انتخاب کنید"}</option>}
          {field.options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
          {field.allowOther && <option value={OTHER_ID}>{field.otherLabel || OTHER_LABEL}</option>}
        </select>
      </Field>
    );
  }

  const multi = field.type === "multi";
  const selected = multi ? listValue(data, field.key) : [textValue(data, field.key)];
  const options = field.allowOther
    ? [...field.options, { id: OTHER_ID, label: field.otherLabel || OTHER_LABEL, hint: OTHER_HINT }]
    : field.options;

  function choose(id: string) {
    if (disabled) return;
    if (multi) setValue(field.key, toggleInList(listValue(data, field.key), id));
    else setValue(field.key, id);
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <p className="text-sm font-medium text-white/85">
          {label}
          {field.hint && <span className="font-normal text-white/45"> ({field.hint})</span>}
        </p>
        <p className="text-xs text-white/40">{multi ? MULTI_SELECT_HINT : SINGLE_SELECT_HINT}</p>
      </div>
      <div className={optionGridClass}>
        {options.map((option) => (
          <OptionButton
            key={option.id}
            selected={selected.includes(option.id)}
            title={option.label}
            subtitle={option.hint}
            onClick={() => choose(option.id)}
          />
        ))}
      </div>
    </div>
  );
}
