package com.ccc.roll_model.global.security.service;

import java.util.Map;

import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ccc.roll_model.global.security.utils.OAuth2UserDetails;
import com.ccc.roll_model.global.security.utils.ProviderUserMapper;
import com.ccc.roll_model.global.security.utils.ProviderUserMapperFactory;
import com.ccc.roll_model.member.domain.Member;
import com.ccc.roll_model.member.domain.MemberRepository;

import lombok.RequiredArgsConstructor;

@Service
@Transactional
@RequiredArgsConstructor
public class Default0Auth2UserServiceImpl extends DefaultOAuth2UserService {
	private final MemberRepository memberRepository;

	@Override
	public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
		OAuth2User oauth2User = new DefaultOAuth2UserService().loadUser(userRequest);

		String registrationId = userRequest.getClientRegistration().getRegistrationId();
		ProviderUserMapper mapper = ProviderUserMapperFactory.getMapper(registrationId);
		Map<String, Object> attributes = mapper.mapAttributes(oauth2User);

		String email = (String) attributes.get("email");
		String name = (String) attributes.get("name");

		// 회원이 존재하지 않으면 새로 저장
		Member member = memberRepository.findByEmail(email)
			.orElseGet(() -> memberRepository.save(
				Member.builder()
					.email(email)
					.nickname(name)
					.provider(Member.Provider.valueOf(registrationId))
					.deletedYn(false)
					.build()
			));
		return new OAuth2UserDetails(member);
	}
}