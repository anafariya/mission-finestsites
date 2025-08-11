const Style = {

  input: 'relative mb-4 last:mb-0',
  base: `relative cursor-pointer w-full overflow-hidden border border-solid border-slate-200 bg-white
    after:absolute after:top-6 after:mt-1 after:right-4 after:w-3 after:h-3 after:opacity-30 
    after:pointer-events-none after:-translate-y-1/2 after:bg-contain rounded 
    after:bg-[url('/assets/icons/ico-dropdown-dark.svg')]
    dark:after:bg-[url('/assets/icons/ico-dropdown-light.svg')]  
    dark:border-slate-600
    dark:bg-slate-800 `,
    
  select: 'relative w-[120%] appearance-none outline-none bg-transparent border-transparent cursor-pointer p-3 dark:bg-gray-700',
  success: 'border-emerald-500 mb-0',
  error: 'text-red-600',

  errorWrapper: `border-0 before:absolute before:left-0 before:right-0 before:top-0 before:bottom-4 
    before:rounded before:border before:border-solid before:z-10 before:border-red-500 after:-mt-3 before:pointer-events-none`,

  warning: 'text-orange-500',
  warningWrapper: `border-0 before:absolute before:left-0 before:right-0 before:top-0 before:bottom-0
    before:rounded before:border before:border-solid efore:z-10 before:border-orange-500 before:pointer-events-none`,

  message: 'mb-0',

}

export default Style;