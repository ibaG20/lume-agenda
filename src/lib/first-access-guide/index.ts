/**
 * Cookie que marca, para o servidor, que o guia do primeiro acesso já foi
 * concluído (ou pulado) por um usuário. O valor é o id do usuário.
 *
 * Enquanto o guia não foi concluído, o dashboard libera as telas de `/inicio`
 * mesmo com o perfil incompleto, para que o guia consiga apresentá-las. Só
 * depois da conclusão o usuário é levado ao preenchimento do perfil.
 */
export const FIRST_ACCESS_GUIDE_COOKIE = "agendinha_guia_concluido_v2";

/**
 * Chave em `user_metadata` do Supabase Auth com a data de conclusão do guia.
 * Mantém a conclusão na conta, valendo para qualquer aparelho ou navegador.
 */
export const FIRST_ACCESS_GUIDE_METADATA_KEY = "agendinha_guia_concluido_em";

export const PROFILE_COMPLETION_PATH = "/perfil?primeiro-acesso=1";
