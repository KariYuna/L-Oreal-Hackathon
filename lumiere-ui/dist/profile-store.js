(function (root) {
  'use strict';
  const key = 'lumiere.profile.v1';
  const defaults = Object.freeze({name:'Jamie Chan',age:'18–24',city:'Beijing',life:'Student',experience:'I’m just getting started',budget:'Keep it budget-friendly',routine:'Cleanser and moisturizer. I prefer to keep it simple.',sensitivities:'',activity:'',environment:'',dailyHabits:''});
  const choices = Object.freeze({
    age:['Prefer not to say','Under 18','18–24','25–34','35–44','45–54','55+'],
    life:['Student','Working','At home','Prefer not to say'],
    experience:['I’m just getting started','I have a basic routine','I know my way around skincare'],
    budget:['Keep it budget-friendly','Comfortable with mid-range','Flexible for the right fit','Ask me each time']
  });
  const limits = {name:80,city:100,routine:600,sensitivities:600,activity:600,environment:600,dailyHabits:600};
  const addedFields = new Set(['activity','environment','dailyHabits']);
  function validate(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Please review your profile fields.');
    const profile = {};
    for (const field of Object.keys(defaults)) {
      if (typeof input[field] !== 'string' && !(addedFields.has(field) && input[field]===undefined)) throw new Error('Please review your profile fields.');
      profile[field] = (input[field]||'').trim();
      if (choices[field] && !choices[field].includes(profile[field])) throw new Error('Please choose one of the listed options.');
      if (limits[field] && profile[field].length > limits[field]) throw new Error(`Please shorten your ${field} to ${limits[field]} characters or fewer.`);
    }
    if (!profile.name) throw new Error('Please enter the name you would like us to use.');
    return profile;
  }
  // A provider defers localStorage access so blocked storage can be handled gracefully.
  function createStore(provider) {
    return {
      load() {
        try {
          const raw = provider().getItem(key);
          if (raw === null) return {data:{...defaults},saved:false,error:''};
          const record = JSON.parse(raw);
          if (record.version !== 1) throw new Error('Unsupported profile format');
          return {data:validate(record.profile),saved:true,error:''};
        } catch { return {data:{...defaults},saved:false,error:'Your saved profile could not be loaded. The sample profile is shown; existing browser data has not been changed.'}; }
      },
      save(input) {
        let data;
        try { data = validate(input); } catch (error) { return {ok:false,error:error.message}; }
        try { provider().setItem(key,JSON.stringify({version:1,profile:data})); }
        catch { return {ok:false,error:'Your browser could not save this profile. Your edits are still here. Enable site storage and try again.'}; }
        return {ok:true,data};
      },
      reset() {
        try { provider().removeItem(key); return {ok:true,data:{...defaults}}; }
        catch { return {ok:false,error:'Your browser could not remove the saved profile. Nothing has changed.'}; }
      }
    };
  }
  function escapeHTML(value) { return String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char])); }
  const api = {key,defaults,choices,limits,validate,createStore,escapeHTML};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.LumiereProfile = api;
})(typeof window !== 'undefined' ? window : globalThis);
